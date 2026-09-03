#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const platform = process.argv[2];
if (platform !== 'android' && platform !== 'ios') {
  console.error('Usage: node scripts/build-team.mjs android|ios');
  process.exit(2);
}

if (!process.env.EXPO_TOKEN && !process.env.EAS_TOKEN) {
  console.error('Ein interner EAS-Testbuild benötigt EXPO_TOKEN oder EAS_TOKEN.');
  process.exit(3);
}

const args = [
  '--yes',
  'eas-cli@latest',
  'build',
  '--platform',
  platform,
  '--profile',
  'team',
  '--non-interactive',
  '--wait',
];

const result = spawnSync('npx', args, { stdio: 'inherit', env: process.env });
if (result.error) {
  console.error(`EAS CLI konnte nicht gestartet werden: ${result.error.message}`);
  process.exit(4);
}
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(platform === 'android'
  ? 'Interner Android-Teamtestbuild als APK abgeschlossen. Das Artefakt steht in der EAS-Ausgabe zum Download bereit.'
  : 'Interner iOS-Teamtestbuild als IPA abgeschlossen. Das Artefakt steht in der EAS-Ausgabe zum Download bereit.');
