#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
const cli = ['--yes', 'eas-cli@latest'];
const buildArgs = [...cli, 'build', '--platform', platform, '--profile', profile, '--non-interactive', '--wait'];
const buildResult = spawnSync('npx', buildArgs, { stdio: 'inherit', env: process.env });
if (buildResult.error) {
  console.error(`Could not start EAS CLI: ${buildResult.error.message}`);
  process.exit(4);
}
if (buildResult.status !== 0) process.exit(buildResult.status ?? 1);

const commit = process.env.GITHUB_SHA ?? process.env.EAS_BUILD_GIT_COMMIT_HASH ?? readGitHead();
const listArgs = [
  ...cli,
  'build:list',
  '--platform',
  platform,
  '--status',
  'finished',
  '--limit',
  '10',
  '--git-commit-hash',
  commit,
  '--json',
  '--non-interactive',
];
const listResult = spawnSync('npx', listArgs, { encoding: 'utf8', env: process.env });
if (listResult.error) {
  console.error(`Could not inspect finished EAS builds: ${listResult.error.message}`);
  process.exit(5);
}
if (listResult.status !== 0) {
  process.stderr.write(listResult.stderr || '');
  process.exit(listResult.status ?? 1);
}

let builds;
try {
  builds = JSON.parse(listResult.stdout);
} catch (error) {
  console.error(`Could not parse EAS build list JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(6);
}

const build = Array.isArray(builds) ? builds[0] : builds?.builds?.[0];
const buildId = build?.id;
if (!buildId) {
  console.error(`No finished ${platform} production build found for commit ${commit}.`);
  process.exit(7);
}

const downloadArgs = [...cli, 'build:download', '--build-id', buildId, '--non-interactive'];
const downloadResult = spawnSync('npx', downloadArgs, { stdio: 'inherit', env: process.env });
if (downloadResult.error) {
  console.error(`Could not download signed ${platform} artifact: ${downloadResult.error.message}`);
  process.exit(8);
}
if (downloadResult.status !== 0) process.exit(downloadResult.status ?? 1);

const extension = platform === 'android' ? '.aab' : '.ipa';
const candidates = readdirSync(process.cwd())
  .filter((name) => name.toLowerCase().endsWith(extension))
  .map((name) => resolve(process.cwd(), name))
  .filter((path) => statSync(path).isFile());

if (candidates.length !== 1) {
  console.error(`Expected exactly one downloaded ${extension} artifact, found ${candidates.length}.`);
  process.exit(9);
}

const artifactPath = candidates[0];
writeFileSync(`${artifactPath}.eas-build-id`, `${buildId}\n`, 'utf8');
console.log(`${platform.toUpperCase()} production build completed and signed artifact downloaded: ${artifactPath}`);

function readGitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout?.trim()) {
    console.error('Could not determine the source commit for EAS build verification.');
    process.exit(10);
  }
  return result.stdout.trim();
}
