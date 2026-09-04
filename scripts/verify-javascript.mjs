import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ignored = new Set(['node_modules', '.git', 'dist', '.expo', 'coverage']);
const extensions = new Set(['.js', '.mjs', '.cjs']);
const root = process.cwd();

function filesIn(dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesIn(path));
    else if (extensions.has(path.slice(path.lastIndexOf('.')).toLowerCase())) result.push(path);
  }
  return result;
}

const files = filesIn(root).sort();
if (!files.length) throw new Error('No JavaScript files found for syntax verification.');

for (const file of files) execFileSync(process.execPath, ['--check', file], { cwd: root, stdio: 'inherit' });

console.log(`TGM ALARM CENTER JavaScript syntax validation: PASS (${files.length} files)`);