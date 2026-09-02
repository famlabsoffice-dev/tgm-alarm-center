#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const platform = process.argv[2];
if (platform !== 'android' && platform !== 'ios') {
  console.error('Usage: node scripts/build-store.mjs android|ios');
  process.exit(2);
}

if (!process.env.EXPO_TOKEN && !process.env.EAS_TOKEN) {
  console.error('A signed EAS build requires EXPO_TOKEN or EAS_TOKEN.');
  process.exit(3);
}

const profile = 'production';
const args = ['--yes', 'eas-cli@latest', 'build', '--platform', platform, '--profile', profile, '--non-interactive', '--wait'];
const result = spawnSync('npx', args, { stdio: 'inherit', env: process.env });
if (result.error) {
  console.error(`Could not start EAS CLI: ${result.error.message}`);
  process.exit(4);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const expected = platform === 'android' ? 'AAB' : 'IPA';
console.log(`${expected} production build completed. Retrieve the signed artifact from the EAS build output.`);
