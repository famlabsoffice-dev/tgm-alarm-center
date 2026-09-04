import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const run = (label, command, args) => {
  console.log(`\n[regression] START ${label}`);
  try {
    execFileSync(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
  } catch (error) {
    const code = typeof error.status === 'number' ? error.status : 1;
    console.error(`[regression] FAIL ${label}: exit ${code}`);
    process.exit(code || 1);
  }
  console.log(`[regression] PASS ${label}`);
};

const requiredFiles = [
  'package.json',
  'app.json',
  'eas.json',
  'App.tsx',
  'src/domain/alarm.ts',
  'src/domain/accountIsolation.ts',
  'src/domain/accountAlarmActions.ts',
  'src/domain/notificationOwnership.ts',
  'src/native/notificationSchedule.ts',
  'src/native/notifications.ts',
  'src/storage/store.ts',
  'src/backup/backup.ts',
  'tests/domain.test.ts',
  'tests/reliability.test.ts',
  'tests/account-alarm-actions.test.ts',
  'tests/notification-schedule.test.ts',
  'tests/server.test.ts',
  'tests/browser-smoke.spec.mjs',
  'scripts/verify-full-release.mjs',
  'scripts/verify-release.mjs',
  'scripts/verify-web-core.mjs',
  'scripts/verify-packaging.mjs',
  'scripts/verify-mobile-build.mjs',
  'scripts/verify-store-config.mjs',
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(root, file)));
if (missing.length) {
  console.error('Regression contract: FAIL');
  for (const file of missing) console.error(`- Required regression asset missing: ${file}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = pkg.scripts ?? {};
for (const name of [
  'typecheck',
  'lint',
  'test',
  'verify:javascript',
  'verify:whitespace',
  'build:web',
  'package:web',
  'verify:packaging',
  'browser:smoke',
  'verify:store-config',
  'verify:mobile-build',
  'verify:release',
  'verify:full-release',
  'verify:migrations',
]) {
  if (typeof scripts[name] !== 'string' || scripts[name].trim() === '') {
    console.error(`Regression contract: missing package script ${name}`);
    process.exit(1);
  }
}

run('canonical full-release gate', 'pnpm', ['verify:full-release']);
run('web build', 'pnpm', ['build:web']);
run('packaged web verification', 'pnpm', ['verify:packaging']);
run('deterministic web archive', 'pnpm', ['package:web']);
run('browser smoke', 'pnpm', ['browser:smoke']);
run('migration status/preflight policy gate', 'pnpm', ['verify:migrations']);

console.log('\nTGM ALARM CENTER regression full-suite contract: PASS');
