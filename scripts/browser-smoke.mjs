import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';
import { chromium } from 'playwright';

const root = process.cwd();
const browserScript = resolve(root, 'scripts/serve-web.mjs');
const webRoot = resolve(root, 'dist/web');
const workRoot = mkdtempSync(join(tmpdir(), 'tgm-alarm-smoke-'));
const downloads = join(workRoot, 'downloads');
const browserProfile = join(workRoot, 'chromium-profile');
mkdirSync(downloads, { recursive: true });

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

async function waitFor(condition, description, timeoutMs = 10000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const result = await condition();
      if (result) return result;
    } catch {}
    await delay(intervalMs);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function ensureBrowser() {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
  } catch (error) {
    console.log('Browser smoke: installing pinned Playwright Chromium runtime.');
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execFileSync(npx, ['--yes', 'playwright@1.55.0', 'install', 'chromium'], { cwd: root, stdio: 'inherit' });
  }
}

if (!existsSync(webRoot)) throw new Error('dist/web does not exist. Run the canonical release verification build first.');
await ensureBrowser();

let serverProcess;
let browser;
try {
  const port = await freePort();
  serverProcess = spawn(process.execPath, [browserScript, '--root', 'dist/web', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(`[web-server] ${chunk}`));
  await waitFor(async () => {
    try { return (await fetch(`http://127.0.0.1:${port}/`)).ok; }
    catch { return false; }
  }, 'packaged web server', 10000);

  browser = await chromium.launchPersistentContext(browserProfile, {
    headless: true,
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'visible' });
  await page.getByText('Schnellstart', { exact: true }).waitFor({ state: 'visible' });
  if (await page.title() !== 'TGM ALARM CENTER') throw new Error('Dashboard document title mismatch.');
  console.log('Browser smoke: dashboard started and rendered.');

  await page.evaluate(() => { localStorage.clear(); location.hash = ''; });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button[data-action="new-alarm"][data-template="bubble"]').click();
  await page.locator('#modalRoot .modal').waitFor({ state: 'visible' });
  await page.locator('#eTitle').fill('CI Smoke Bubble');
  const future = new Date(Date.now() + 10 * 60 * 1000);
  const dateValue = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  const timeValue = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;
  await page.locator('#eDate').fill(dateValue);
  await page.locator('#eTime').fill(timeValue);
  await page.locator('#modalRoot button[data-action="save-alarm"]').click();
  await page.getByText('CI Smoke Bubble', { exact: true }).waitFor({ state: 'visible' });
  console.log('Browser smoke: alarm editor + create/save passed.');

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('CI Smoke Bubble', { exact: true }).waitFor({ state: 'visible' });
  console.log('Browser smoke: reload persistence passed.');

  await page.locator('button[data-action="view"][data-view="settings"]').click();
  await page.getByText('Backup & Wiederherstellung', { exact: true }).waitFor({ state: 'visible' });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('button[data-action="export-backup"]').click();
  const download = await downloadPromise;
  const backupFile = join(downloads, download.suggestedFilename());
  await download.saveAs(backupFile);
  if (!existsSync(backupFile) || statSync(backupFile).size === 0) throw new Error('Backup export produced no usable file.');
  console.log(`Browser smoke: backup export passed (${backupFile}).`);

  await page.evaluate(() => { localStorage.clear(); location.hash = ''; });
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.getByText('CI Smoke Bubble', { exact: true }).count()) throw new Error('Alarm survived reset before backup import.');
  await page.locator('button[data-action="view"][data-view="settings"]').click();
  await page.getByText('Backup & Wiederherstellung', { exact: true }).waitFor({ state: 'visible' });
  await page.locator('#backupFile').setInputFiles(backupFile);
  await page.getByText('CI Smoke Bubble', { exact: true }).waitFor({ state: 'visible' });
  console.log('Browser smoke: backup import passed.');

  if (consoleErrors.length) throw new Error(`Console error(s): ${consoleErrors.join(' | ')}`);
  if (pageErrors.length) throw new Error(`Page exception(s): ${pageErrors.join(' | ')}`);
  console.log('TGM ALARM CENTER browser smoke: PASS');
} finally {
  await browser?.close();
  if (serverProcess && !serverProcess.killed) serverProcess.kill('SIGTERM');
  await delay(250);
  rmSync(workRoot, { recursive: true, force: true });
}