import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';

function locatePlaywrightPackage() {
  const cacheRoot = execFileSync('npm', ['config', 'get', 'cache'], { encoding: 'utf8' }).trim();
  const npxRoot = join(cacheRoot, '_npx');
  if (!existsSync(npxRoot)) return null;
  const candidates = [];
  for (const entry of readdirSync(npxRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageRoot = join(npxRoot, entry.name, 'node_modules', 'playwright');
    const packageFile = join(packageRoot, 'package.json');
    if (existsSync(packageFile)) candidates.push({ packageRoot, mtime: statSync(packageFile).mtimeMs });
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.packageRoot || null;
}

function freePort() {
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

async function waitFor(condition, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await condition()) return; } catch {}
    await delay(100);
  }
  throw new Error('Timed out waiting for packaged web server.');
}

const playwrightRoot = locatePlaywrightPackage();
if (!playwrightRoot) throw new Error('Pinned Playwright package is unavailable in the npx cache.');
const { chromium } = createRequire(pathToFileURL(join(playwrightRoot, 'package.json')))('playwright');
const root = process.cwd();
const output = resolve(root, 'release-previews/0.0.2');
mkdirSync(output, { recursive: true });
const workRoot = mkdtempSync(join(tmpdir(), 'tgm-release-002-'));
const serverScript = resolve(root, 'scripts/serve-web.mjs');
let server;
let browser;
try {
  execFileSync('node', ['scripts/build-web.mjs'], { cwd: root, stdio: 'inherit' });
  const port = await freePort();
  server = spawn(process.execPath, [serverScript, '--root', 'dist/web', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (chunk) => process.stderr.write(`[web-server] ${chunk}`));
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitFor(async () => { try { return (await fetch(baseUrl)).ok; } catch { return false; } });
  browser = await chromium.launchPersistentContext(join(workRoot, 'profile'), { headless: true, locale: 'de-DE', viewport: { width: 1440, height: 1000 }, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(output, '01-dashboard.png'), fullPage: true });
  await page.locator('button[data-action="new-alarm"][data-template="bubble"]').first().click();
  await page.locator('#modalRoot .modal').waitFor({ state: 'visible' });
  await page.screenshot({ path: join(output, '02-alarm-editor.png'), fullPage: true });
  await page.locator('[data-action="close-modal"]').first().click();
  await page.evaluate(() => {
    const now = Date.now();
    const state = { schemaVersion: 2, tier: 'free', activeAccountId: 'preview-account', accounts: [{ id: 'preview-account', name: 'Preview-Kommando', color: '#F4C969', createdAt: new Date(now).toISOString() }], alarms: [{ id: 'preview-alarm', accountId: 'preview-account', title: 'Abend-Bubble', type: 'bubble', eventAt: now + 2 * 60 * 60 * 1000, repeat: 'once', warnings: [60, 15], sound: 'siren', active: true, protected: true, completedOccurrences: {}, createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() }], preferences: { warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, sound: 'pulse', audioEnabled: false }, firedMoments: {}, testConfirmedAt: null, freeTrialStartedAt: null, freeTrialEndsAt: null, updatedAt: new Date(now).toISOString() };
    localStorage.setItem('tgm-alarm-center-web-v2', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: join(output, '03-alarm-dashboard.png'), fullPage: true });
  await page.locator('button[data-action="view"][data-view="settings"]').first().click();
  await page.getByText('Backup & Wiederherstellung', { exact: true }).waitFor({ state: 'visible' });
  await page.screenshot({ path: join(output, '04-settings-backup.png'), fullPage: true });
  console.log(`Release 0.0.2 previews created in ${output}`);
} finally {
  await browser?.close();
  if (server && !server.killed) server.kill('SIGTERM');
  await delay(200);
  rmSync(workRoot, { recursive: true, force: true });
}
