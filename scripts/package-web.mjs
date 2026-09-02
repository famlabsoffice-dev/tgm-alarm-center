import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputRoot = resolve(root, 'dist/web');
const archivePath = resolve(root, process.env.TGM_WEB_ARCHIVE || 'dist/tgm-alarm-center-web.zip');
const checksumPath = resolve(root, process.env.TGM_WEB_CHECKSUM || 'dist/tgm-alarm-center-web.zip.sha256');
const epoch = '1980-01-01T00:00:00Z';

const requiredManifest = resolve(inputRoot, 'BUILD-MANIFEST.json');
const manifest = JSON.parse(await readFile(requiredManifest, 'utf8'));
if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
  throw new Error('BUILD-MANIFEST.json contains no package files. Run the web build first.');
}

const archiveParent = dirname(archivePath);
const checksumParent = dirname(checksumPath);
await import('node:fs/promises').then(({ mkdir }) => Promise.all([
  mkdir(archiveParent, { recursive: true }),
  mkdir(checksumParent, { recursive: true }),
]));

const stagingRoot = await mkdtemp(join(resolve(root, 'dist'), '.web-archive-'));
const normalizedRoot = join(stagingRoot, 'web');
try {
  await cp(inputRoot, normalizedRoot, { recursive: true, force: true });
  execFileSync('find', [normalizedRoot, '-exec', 'touch', '-h', '-d', epoch, '{}', '+'], { stdio: 'ignore' });
  await stat(normalizedRoot);

  const relativeFiles = execFileSync('find', ['web', '-type', 'f', '-print'], {
    cwd: stagingRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
  if (relativeFiles.length !== manifest.files.length + 1) {
    throw new Error(`Archive file count mismatch: manifest=${manifest.files.length}, package=${relativeFiles.length}`);
  }

  const fileList = `${relativeFiles.join('\n')}\n`;
  execFileSync('zip', ['-X', '-q', '-9', archivePath, '-@'], {
    cwd: stagingRoot,
    input: fileList,
    stdio: ['pipe', 'ignore', 'pipe'],
  });

  const digest = execFileSync('sha256sum', [archivePath], { encoding: 'utf8' }).trim();
  const archiveName = archivePath.slice(archivePath.lastIndexOf('/') + 1);
  await writeFile(checksumPath, `${digest.split(/\s+/)[0]}  ${archiveName}\n`, 'utf8');
  console.log(`Deterministic web archive created: ${archivePath}`);
  console.log(`SHA-256 checksum created: ${checksumPath}`);
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
