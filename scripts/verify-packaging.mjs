import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const root = process.cwd();
const outputRoot = resolve(root, 'dist/web');
const requiredFiles = [
  'index.html', 'app.js', 'styles.css', 'styles-accessibility.css',
  'reference-theme.css', 'reference-theme-global.css', 'reference-theme-final.css',
  'founder-access.js', 'founder-runtime.js', 'account-delete.js', 'ui-cleanup.js',
  'sw.js', 'sw-v27.js', 'sw-v28.js', 'sw-v30.js', 'manifest.webmanifest', 'icon.png',
  'assets/notifications/alarm-pulse.wav', 'assets/notifications/alarm-siren.wav', 'assets/notifications/alarm-chime.wav',
];

if (!existsSync(resolve(outputRoot, 'BUILD-MANIFEST.json'))) throw new Error('Build manifest is missing.');
for (const file of requiredFiles) {
  const path = resolve(outputRoot, file);
  if (!existsSync(path)) throw new Error(`Packaged asset is missing: ${file}`);
  if (statSync(path).size === 0) throw new Error(`Packaged asset is empty: ${file}`);
}

const manifest = JSON.parse(readFileSync(resolve(outputRoot, 'manifest.webmanifest'), 'utf8'));
if (manifest.orientation !== 'any') throw new Error('Packaged manifest orientation must be any.');

const html = readFileSync(resolve(outputRoot, 'index.html'), 'utf8');
for (const ref of [
  'manifest.webmanifest', 'icon.png', 'styles.css?v=10', 'styles-accessibility.css?v=1',
  'reference-theme.css?v=4', 'reference-theme-global.css?v=3', 'reference-theme-final.css?v=1',
  'founder-access.js?v=4', 'founder-runtime.js?v=1', 'account-delete.js?v=1', 'ui-cleanup.js?v=3',
  "navigator.serviceWorker.register('./sw-v30.js')",
]) {
  if (!html.includes(ref)) throw new Error(`Packaged HTML reference is missing: ${ref}`);
}

const runtime = readFileSync(resolve(outputRoot, 'founder-runtime.js'), 'utf8');
if (!runtime.includes("const SOURCE_URL = './app.js?v=26';")) throw new Error('Packaged founder runtime does not point to the current app asset.');

const js = readFileSync(resolve(outputRoot, 'app.js'), 'utf8');
for (const marker of ["const app = document.getElementById('app');", 'function exportBackup()', 'async function importBackup(file)', 'data-action="new-alarm"', 'id="eTitle"']) {
  if (!js.includes(marker)) throw new Error(`Packaged application marker is missing: ${marker}`);
}

const sw = readFileSync(resolve(outputRoot, 'sw-v30.js'), 'utf8');
for (const asset of ['alarm-pulse.wav', 'alarm-siren.wav', 'alarm-chime.wav']) {
  if (!sw.includes(asset)) throw new Error(`Current service-worker asset reference is missing: ${asset}`);
}

if (/\b(?:TODO|FIXME)\b|Lorem ipsum/i.test(`${html}\n${js}\n${runtime}\n${sw}`)) throw new Error('Placeholder marker found in packaged web application.');

const allowedExtensions = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.png', '.wav']);
const stack = [outputRoot];
let fileCount = 0;
while (stack.length) {
  const dir = stack.pop();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) stack.push(path);
    else {
      fileCount += 1;
      if (!allowedExtensions.has(extname(entry.name).toLowerCase())) throw new Error(`Unexpected packaged file: ${relative(outputRoot, path)}`);
    }
  }
}
if (fileCount < requiredFiles.length + 1) throw new Error(`Incomplete web package: ${fileCount} files found.`);
console.log(`TGM ALARM CENTER packaged web verification: PASS (${fileCount} files)`);
