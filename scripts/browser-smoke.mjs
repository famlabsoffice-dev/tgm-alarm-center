import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';

const root = process.cwd();
const browserScript = resolve(root, 'scripts/serve-web.mjs');
const webRoot = resolve(root, 'dist/web');
const workRoot = mkdtempSync(join(tmpdir(), 'tgm-alarm-smoke-'));
const downloads = join(workRoot, 'downloads');
const userData = join(workRoot, 'chromium-profile');
mkdirSync(downloads, { recursive: true });

function commandExists(command) {
  try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [command], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function cachedChromium() {
  const cacheRoot = join(process.env.HOME || process.env.USERPROFILE || tmpdir(), '.cache', 'ms-playwright');
  if (!existsSync(cacheRoot)) return null;
  const candidates = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/^(chrome|headless_shell)(\.exe)?$/i.test(entry.name)) candidates.push(path);
    }
  };
  walk(cacheRoot);
  return candidates.find((path) => /chrome|chromium|headless/i.test(path)) || null;
}

function resolveChromium() {
  if (process.env.CHROMIUM_BIN && existsSync(process.env.CHROMIUM_BIN)) return process.env.CHROMIUM_BIN;
  for (const candidate of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    if (commandExists(candidate)) return candidate;
  }
  return cachedChromium();
}

function installChromium() {
  console.log('Browser smoke: Chromium not found, installing pinned Playwright Chromium runtime.');
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, ['--yes', 'playwright@1.55.0', 'install', 'chromium'], { cwd: root, stdio: 'inherit' });
  return resolveChromium();
}

const chromium = resolveChromium() || installChromium();
if (!chromium) throw new Error('Unable to locate a Chromium executable.');
if (!existsSync(webRoot)) throw new Error('dist/web does not exist. Run the canonical release verification build first.');

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

class CdpClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolveConnection, rejectConnection) => {
      const timeout = setTimeout(() => rejectConnection(new Error('CDP websocket connection timed out.')), 10000);
      this.ws.addEventListener('open', () => { clearTimeout(timeout); resolveConnection(); });
      this.ws.addEventListener('error', (event) => { clearTimeout(timeout); rejectConnection(new Error(`CDP websocket error: ${event.message || 'unknown'}`)); });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      const handlers = this.listeners.get(message.method) || [];
      for (const handler of handlers) handler(message.params || {}, message.sessionId || null);
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    return new Promise((resolveCommand, rejectCommand) => {
      this.pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
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

async function pickDownloadedBackup() {
  return waitFor(async () => {
    const files = readdirSync(downloads).filter((file) => file.endsWith('.json')).map((file) => join(downloads, file));
    if (!files.length) return null;
    const file = files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
    return statSync(file).size > 0 ? file : null;
  }, 'backup download', 10000);
}

let serverProcess;
let browserProcess;
let cdp;
let sessionId;
const consoleErrors = [];
const exceptions = [];

try {
  const port = await freePort();
  serverProcess = spawn(process.execPath, [browserScript, '--root', 'dist/web', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(`[web-server] ${chunk}`));
  await waitFor(async () => {
    try { return (await fetch(`http://127.0.0.1:${port}/`)).ok; }
    catch { return false; }
  }, 'packaged web server', 10000);

  const debugPort = await freePort();
  browserProcess = spawn(chromium, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--disable-default-apps', '--disable-extensions',
    '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${userData}`, 'about:blank',
  ], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  browserProcess.stderr.on('data', (chunk) => {
    const text = String(chunk);
    if (/DevTools listening on/i.test(text)) process.stdout.write(text);
    else process.stderr.write(`[chromium] ${text}`);
  });

  const version = await waitFor(async () => {
    try { const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`); return response.ok ? response.json() : null; }
    catch { return null; }
  }, 'Chromium DevTools endpoint', 15000);

  cdp = new CdpClient(version.webSocketDebuggerUrl);
  await cdp.connect();
  const target = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  sessionId = attached.sessionId;
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('DOM.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  cdp.on('Runtime.consoleAPICalled', (params, incomingSession) => {
    if (incomingSession === sessionId && params.type === 'error') consoleErrors.push(params.args?.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  });
  cdp.on('Runtime.exceptionThrown', (params, incomingSession) => {
    if (incomingSession === sessionId) exceptions.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'Unhandled page exception');
  });
  cdp.on('Log.entryAdded', (params, incomingSession) => {
    if (incomingSession === sessionId && params.entry?.level === 'error') consoleErrors.push(params.entry.text || 'Browser log error');
  });
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/` }, sessionId);

  const evaluate = async (expression) => {
    const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result?.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed.');
    return result?.result?.value;
  };

  const reload = async () => {
    await cdp.send('Page.reload', { ignoreCache: true }, sessionId);
    await waitFor(() => evaluate('document.readyState === "complete"'), 'page reload', 10000);
    await waitFor(() => evaluate('Boolean(document.querySelector("#app")?.innerText?.trim())'), 'dashboard render', 10000);
  };

  const waitText = async (text) => waitFor(() => evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`), `visible text ${text}`, 10000);
  const click = async (selector) => {
    const result = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.scrollIntoView({ block: 'center' }); element.click(); return true; })()`);
    if (!result) throw new Error(`Unable to click ${selector}.`);
  };
  const setValue = async (selector, value) => {
    const changed = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; if (!setter) return false; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    if (!changed) throw new Error(`Unable to set ${selector}.`);
  };

  await waitFor(() => evaluate('document.readyState === "complete"'), 'initial document load', 10000);
  await waitFor(() => evaluate('Boolean(document.querySelector("#app")?.innerText?.trim())'), 'initial dashboard render', 10000);
  console.log('Browser smoke: dashboard started and rendered.');
  if (!(await evaluate('document.title === "TGM ALARM CENTER"'))) throw new Error('Dashboard document title mismatch.');
  await waitText('Schnellstart');

  await evaluate('localStorage.clear(); location.hash="";');
  await reload();
  await click('button[data-action="new-alarm"][data-template="bubble"]');
  await waitFor(() => evaluate('Boolean(document.querySelector("#modalRoot .modal"))'), 'alarm editor open');
  await setValue('#eTitle', 'CI Smoke Bubble');

  const future = new Date(Date.now() + 10 * 60 * 1000);
  const dateValue = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  const timeValue = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;
  await setValue('#eDate', dateValue);
  await setValue('#eTime', timeValue);
  await click('#modalRoot button[data-action="save-alarm"]');
  await waitText('CI Smoke Bubble');
  console.log('Browser smoke: alarm editor + create/save passed.');

  await reload();
  await waitText('CI Smoke Bubble');
  console.log('Browser smoke: reload persistence passed.');

  await click('button[data-action="view"][data-view="settings"]');
  await waitText('Backup & Wiederherstellung');
  await click('button[data-action="export-backup"]');
  const backupFile = await pickDownloadedBackup();
  console.log(`Browser smoke: backup export passed (${backupFile}).`);

  await evaluate('localStorage.clear(); location.hash="";');
  await reload();
  if (await evaluate('document.body.innerText.includes("CI Smoke Bubble")')) throw new Error('Alarm survived reset before backup import.');
  await click('button[data-action="view"][data-view="settings"]');
  await waitText('Backup & Wiederherstellung');
  const documentTree = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
  const query = await cdp.send('DOM.querySelector', { nodeId: documentTree.root.nodeId, selector: '#backupFile' }, sessionId);
  if (!query.nodeId) throw new Error('Backup file input was not found.');
  await cdp.send('DOM.setFileInputFiles', { nodeId: query.nodeId, files: [backupFile] }, sessionId);
  await waitText('CI Smoke Bubble');
  console.log('Browser smoke: backup import passed.');

  if (consoleErrors.length) throw new Error(`Console error(s): ${consoleErrors.join(' | ')}`);
  if (exceptions.length) throw new Error(`Page exception(s): ${exceptions.join(' | ')}`);
  console.log('TGM ALARM CENTER browser smoke: PASS');
} finally {
  cdp?.close();
  if (browserProcess && !browserProcess.killed) browserProcess.kill('SIGTERM');
  if (serverProcess && !serverProcess.killed) serverProcess.kill('SIGTERM');
  await delay(250);
  rmSync(workRoot, { recursive: true, force: true });
}