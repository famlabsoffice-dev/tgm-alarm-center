import { spawnSync } from 'node:child_process';

const checks = [
  ['typecheck', ['pnpm', 'typecheck']],
  ['lint', ['pnpm', 'lint']],
  ['tests', ['pnpm', 'test']],
  ['javascript', ['pnpm', 'verify:javascript']],
  ['whitespace', ['pnpm', 'verify:whitespace']],
  ['expo-config', ['pnpm', 'exec', 'expo', 'config', '--json']],
  ['android-reliability', ['pnpm', 'verify:android-reliability']],
  ['store-config', ['pnpm', 'verify:store-config']],
  ['mobile-build', ['pnpm', 'verify:mobile-build']],
  ['release-verification', ['pnpm', 'verify:release']],
];

for (const [name, command] of checks) {
  console.log(`FULL GATE START ${name}`);
  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
  if (result.error) {
    console.error(`FULL GATE FAIL ${name}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`FULL GATE FAIL ${name}: exit ${result.status ?? 'unknown'}`);
    process.exit(result.status || 1);
  }
  console.log(`FULL GATE PASS ${name}`);
}

console.log('TGM ALARM CENTER full release gate: PASS');
