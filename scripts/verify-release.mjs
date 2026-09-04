import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const steps = [
  ['Lint', ['run', 'lint']],
  ['Typecheck', ['run', 'typecheck']],
  ['Domain + Web Core + Pricing tests', ['run', 'test']],
  ['Production floor', ['run', 'verify:production-floor']],
  ['JavaScript syntax', ['run', 'verify:javascript']],
  ['Whitespace', ['run', 'verify:whitespace']],
  ['Web build/package', ['run', 'build:web']],
  ['Packaged web verification', ['run', 'verify:packaging']],
  ['Store configuration', ['run', 'verify:store-config']],
  ['Deterministic web archive', ['run', 'package:web']],
  ['Browser smoke', ['run', 'browser:smoke']],
];

for (const [label, args] of steps) {
  process.stdout.write(`\n[release] ${label}\n`);
  try {
    await execFileAsync(pnpm, args, { cwd: process.cwd(), env: process.env, maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    process.stderr.write(`\n[release] FAIL: ${label}\n`);
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    process.exit(error.code || 1);
  }
}

console.log('\nTGM ALARM CENTER release verification: PASS');
