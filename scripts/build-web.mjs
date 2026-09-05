import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outputRoot = new URL('../dist/web/', import.meta.url);

const sourceFiles = ['index.html', 'app.js', 'styles.css', 'styles-accessibility.css', 'sw.js', 'manifest.webmanifest', 'icon.png'];
const soundFiles = [
  'assets/notifications/alarm-pulse.wav',
  'assets/notifications/alarm-siren.wav',
  'assets/notifications/alarm-chime.wav',
];

for (const file of [...sourceFiles, ...soundFiles]) {
  const path = new URL(`../${file}`, import.meta.url);
  if (!existsSync(path)) throw new Error(`Missing web source asset: ${file}`);
  if (statSync(path).size === 0) throw new Error(`Empty web source asset: ${file}`);
}

const fs = await import('node:fs/promises');
await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

for (const file of sourceFiles) {
  await fs.copyFile(new URL(`../${file}`, import.meta.url), new URL(file, outputRoot));
}
await fs.cp(new URL('../assets/', import.meta.url), new URL('assets/', outputRoot), { recursive: true });

const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', outputRoot), 'utf8'));
if (manifest.orientation !== 'any') throw new Error('Web manifest must allow portrait and landscape orientation.');

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