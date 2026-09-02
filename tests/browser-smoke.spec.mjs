import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import net from 'node:net';
import { test, expect } from 'playwright/test';

const root = resolve(process.cwd());
const serverScript = resolve(root, 'scripts/serve-web.mjs');
const webRoot = resolve(root, 'dist/web');
const workRoot = mkdtempSync(join(tmpdir(), 'tgm-alarm-playwright-'));
const downloads = join(workRoot, 'downloads');
mkdirSync(downloads, { recursive: true });
let serverProcess;
let baseUrl;

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Packaged web server did not become ready at ${url}.`);
}

test.beforeAll(async () => {
  if (!existsSync(webRoot)) throw new Error('dist/web does not exist. Run the canonical web build before the browser smoke test.');
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, [serverScript, '--root', 'dist/web', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(`[web-server] ${chunk}`));
  await waitForServer(`${baseUrl}/`);
});

test.afterAll(() => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill('SIGTERM');
  rmSync(workRoot, { recursive: true, force: true });
});

test('dashboard, alarm lifecycle and backup roundtrip', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'visible' });
  await page.getByText('Schnellstart', { exact: true }).waitFor({ state: 'visible' });
  await expect(page).toHaveTitle('TGM ALARM CENTER');
  console.log('Browser smoke: dashboard started and rendered.');

  await page.evaluate(() => { localStorage.clear(); location.hash = ''; });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button[data-action="new-alarm"][data-template="bubble"]').click();
  await page.locator('#modalRoot .modal').waitFor({ state: 'visible' });
  await page.locator('#eTitle').fill('CI Smoke Bubble');
  const future = new Date(Date.now() + 10 * 60 * 1000);
  await page.locator('#eDate').fill(`${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`);
  await page.locator('#eTime').fill(`${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`);
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
  expect(existsSync(backupFile)).toBeTruthy();
  expect(statSync(backupFile).size).toBeGreaterThan(0);
  console.log(`Browser smoke: backup export passed (${backupFile}).`);

  await page.evaluate(() => { localStorage.clear(); location.hash = ''; });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('CI Smoke Bubble', { exact: true })).toHaveCount(0);
  await page.locator('button[data-action="view"][data-view="settings"]').click();
  await page.getByText('Backup & Wiederherstellung', { exact: true }).waitFor({ state: 'visible' });
  await page.locator('#backupFile').setInputFiles(backupFile);
  await page.getByText('CI Smoke Bubble', { exact: true }).waitFor({ state: 'visible' });
  console.log('Browser smoke: backup import passed.');

  expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  expect(pageErrors, `Page exceptions: ${pageErrors.join(' | ')}`).toEqual([]);
  console.log('Browser smoke: console/page error check passed.');
});