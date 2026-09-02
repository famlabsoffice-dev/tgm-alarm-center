import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['node_modules', '.git', 'dist', '.expo', 'coverage']);
const extensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.html', '.json', '.yaml', '.yml']);

function filesIn(dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesIn(path));
    else if (extensions.has(extname(path).toLowerCase())) result.push(path);
  }
  return result;
}

const files = filesIn(root).sort();
const trailingWhitespace = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[\t ]+$/.test(line)) trailingWhitespace.push(`${relative(root, file)}:${index + 1}`);
  });
}

if (trailingWhitespace.length) {
  console.error('Trailing whitespace found:');
  console.error(trailingWhitespace.join('\n'));
  process.exit(1);
}

execFileSync('git', ['diff', '--check'], { cwd: root, stdio: 'inherit' });
console.log(`TGM ALARM CENTER whitespace validation: PASS (${files.length} source/config files)`);