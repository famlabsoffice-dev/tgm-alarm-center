import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const root = process.cwd();
const outputRoot = resolve(root, 'dist/web');
const requiredFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'sw.js',
  'manifest.webmanifest',
  'icon.png',
  'assets/notifications/alarm-pulse.wav',
  'assets/notifications/alarm-siren.wav',
  'assets/notifications/alarm-chime.wav',
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
for (const ref of ['manifest.webmanifest', 'icon.png', 'styles.css?v=6', 'app.js?v=18', './sw.js']) {
  if (!html.includes(ref)) throw new Error(`Packaged HTML reference is missing: ${ref}`);
}

const js = readFileSync(resolve(outputRoot, 'app.js'), 'utf8');
for (const marker of ['const app = document.getElementById(\'app\');', 'function exportBackup()', 'async function importBackup(file)', 'data-action="new-alarm"', 'id="eTitle"']) {
  if (!js.includes(marker)) throw new Error(`Packaged application marker is missing: ${marker}`);
}

const sw = readFileSync(resolve(outputRoot, 'sw.js'), 'utf8');
for (const asset of ['alarm-pulse.wav', 'alarm-siren.wav', 'alarm-chime.wav']) {
  if (!sw.includes(asset)) throw new Error(`Packaged service-worker asset reference is missing: ${asset}`);
}

const placeholders = /\b(?:TODO|FIXME)\b|Lorem ipsum/i;
if (placeholders.test(`${html}\n${js}\n${sw}`)) throw new Error('Placeholder marker found in packaged web application.');

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
      const ext = extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(ext)) throw new Error(`Unexpected packaged file: ${relative(outputRoot, path)}`);
    }
  }
}
if (fileCount < requiredFiles.length + 1) throw new Error(`Incomplete web package: ${fileCount} files found.`);

console.log(`TGM ALARM CENTER packaged web verification: PASS (${fileCount} files)`);