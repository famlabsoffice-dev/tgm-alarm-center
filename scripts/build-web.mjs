import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const outputRoot = new URL('../dist/web/', import.meta.url);

const sourceFiles = [
  'index.html', 'app.js', 'styles.css', 'styles-accessibility.css',
  'reference-theme.css', 'reference-theme-global.css', 'reference-theme-final.css',
  'tgm-intelligence.js', 'tgm-intelligence.css',
  'founder-access.js', 'founder-runtime.js', 'account-delete.js', 'ui-cleanup.js',
  'sw.js', 'sw-v27.js', 'sw-v28.js', 'sw-v30.js', 'manifest.webmanifest',
];
const binaryFiles = [
  ['assets/tgm-alarm-center-icon.png', 'icon.png'],
  ['assets/tgm-alarm-center-icon.png', 'assets/tgm-alarm-center-icon.png'],
  ['assets/notifications/alarm-pulse.wav', 'assets/notifications/alarm-pulse.wav'],
  ['assets/notifications/alarm-siren.wav', 'assets/notifications/alarm-siren.wav'],
  ['assets/notifications/alarm-chime.wav', 'assets/notifications/alarm-chime.wav'],
];

for (const file of sourceFiles) {
  const path = new URL(`../${file}`, import.meta.url);
  if (!existsSync(path)) throw new Error(`Missing web source asset: ${file}`);
  if (statSync(path).size === 0) throw new Error(`Empty web source asset: ${file}`);
}
for (const [source] of binaryFiles) {
  const path = new URL(`../${source}`, import.meta.url);
  if (!existsSync(path)) throw new Error(`Missing web binary asset: ${source}`);
  if (statSync(path).size === 0) throw new Error(`Empty web binary asset: ${source}`);
}

const fs = await import('node:fs/promises');
await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

for (const file of sourceFiles) await fs.copyFile(new URL(`../${file}`, import.meta.url), new URL(file, outputRoot));
for (const [source, destination] of binaryFiles) {
  const target = new URL(destination, outputRoot);
  await fs.mkdir(new URL('./', target), { recursive: true });
  await fs.copyFile(new URL(`../${source}`, import.meta.url), target);
}

const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', outputRoot), 'utf8'));
if (manifest.orientation !== 'any') throw new Error('Web manifest must allow portrait and landscape orientation.');
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.src === './icon.png')) throw new Error('Web manifest must reference the packaged icon asset.');

const index = readFileSync(new URL('index.html', outputRoot), 'utf8');
for (const requiredScript of ['founder-access.js?v=4', 'founder-runtime.js?v=1', 'tgm-intelligence.js?v=1', 'sw-v30.js']) {
  if (!index.includes(requiredScript)) throw new Error(`Web shell is missing the current runtime asset: ${requiredScript}`);
}
if (!index.includes('tgm-intelligence.css?v=1')) throw new Error('Web shell is missing intelligence styling.');
if (!readFileSync(new URL('founder-runtime.js', outputRoot), 'utf8').includes('./app.js?v=26')) throw new Error('Founder runtime must bootstrap the pinned web application asset.');

const commit = process.env.GITHUB_SHA || (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
})();
const packageFiles = [];
const collect = async (dir, relative = '') => {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const child = `${relative}${entry.name}`;
    if (entry.isDirectory()) await collect(new URL(`${entry.name}/`, dir), `${child}/`);
    else packageFiles.push(child);
  }
};
await collect(outputRoot);
packageFiles.sort();
await fs.writeFile(new URL('BUILD-MANIFEST.json', outputRoot), `${JSON.stringify({ sourceCommit: commit, files: packageFiles }, null, 2)}\n`, 'utf8');
console.log(`Web package created: dist/web (${packageFiles.length + 1} files, source ${commit})`);