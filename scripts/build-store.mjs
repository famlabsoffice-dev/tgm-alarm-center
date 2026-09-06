#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
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
const env = { ...process.env };

const initArgs = [...cli, 'init', '--account', process.env.EAS_ACCOUNT ?? 'famlabs', '--non-interactive', '--json'];
const initResult = spawnSync('npx', initArgs, { encoding: 'utf8', env });
if (initResult.error) {
  console.error(`Could not start EAS project initialization: ${initResult.error.message}`);
  process.exit(4);
}
if (initResult.status !== 0) {
  process.stderr.write(initResult.stderr || '');
  process.exit(initResult.status ?? 1);
}

const buildArgs = [...cli, 'build', '--platform', platform, '--profile', profile, '--non-interactive', '--wait'];
const buildResult = spawnSync('npx', buildArgs, { stdio: 'inherit', env });
if (buildResult.error) {
  console.error(`Could not start EAS build: ${buildResult.error.message}`);
  process.exit(5);
}
if (buildResult.status !== 0) process.exit(buildResult.status ?? 1);

const commit = process.env.GITHUB_SHA ?? process.env.EAS_BUILD_GIT_COMMIT_HASH ?? readGitHead();
const listArgs = [...cli, 'build:list', '--platform', platform, '--status', 'finished', '--limit', '10', '--git-commit-hash', commit, '--json', '--non-interactive'];
const listResult = spawnSync('npx', listArgs, { encoding: 'utf8', env });
if (listResult.error) {
  console.error(`Could not inspect finished EAS builds: ${listResult.error.message}`);
  process.exit(6);
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
  process.exit(7);
}

const build = Array.isArray(builds) ? builds[0] : builds?.builds?.[0];
const buildId = build?.id;
if (!buildId) {
  console.error(`No finished ${platform} production build found for commit ${commit}.`);
  process.exit(8);
}

const viewArgs = [...cli, 'build:view', buildId, '--json'];
const viewResult = spawnSync('npx', viewArgs, { encoding: 'utf8', env });
if (viewResult.error) {
  console.error(`Could not inspect EAS build ${buildId}: ${viewResult.error.message}`);
  process.exit(9);
}
if (viewResult.status !== 0) {
  process.stderr.write(viewResult.stderr || '');
  process.exit(viewResult.status ?? 1);
}

let buildView;
try {
  buildView = JSON.parse(viewResult.stdout);
} catch (error) {
  console.error(`Could not parse EAS build ${buildId} JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(10);
}

const artifactUrl = findArtifactUrl(buildView, platform);
if (!artifactUrl) {
  console.error(`No ${platform} application artifact URL was returned for EAS build ${buildId}.`);
  process.exit(11);
}

const extension = platform === 'android' ? '.aab' : '.ipa';
const artifactPath = resolve(process.cwd(), `tgm-${platform}-production${extension}`);
const response = await fetch(artifactUrl, { redirect: 'follow' });
if (!response.ok) {
  console.error(`EAS artifact download failed with HTTP ${response.status}.`);
  process.exit(12);
}
const bytes = new Uint8Array(await response.arrayBuffer());
if (bytes.byteLength === 0) {
  console.error('EAS artifact download returned an empty file.');
  process.exit(13);
}
writeFileSync(artifactPath, bytes);

const candidates = readdirSync(process.cwd())
  .filter((name) => name.toLowerCase().endsWith(extension))
  .map((name) => resolve(process.cwd(), name))
  .filter((path) => statSync(path).isFile());

if (candidates.length !== 1 || candidates[0] !== artifactPath) {
  console.error(`Expected exactly one downloaded ${extension} artifact, found ${candidates.length}.`);
  process.exit(14);
}

writeFileSync(`${artifactPath}.eas-build-id`, `${buildId}\n`, 'utf8');
console.log(`${platform.toUpperCase()} production build completed and signed artifact downloaded: ${artifactPath}`);

function findArtifactUrl(value, targetPlatform) {
  if (!value || typeof value !== 'object') return null;
  const preferredKeys = targetPlatform === 'android'
    ? ['buildUrl', 'applicationArchiveUrl']
    : ['buildUrl', 'applicationArchiveUrl'];
  for (const key of preferredKeys) {
    if (typeof value[key] === 'string' && /^https?:\/\//.test(value[key])) return value[key];
  }
  for (const child of Object.values(value)) {
    if (typeof child === 'object') {
      const nested = findArtifactUrl(child, targetPlatform);
      if (nested) return nested;
    }
  }
  return null;
}

function readGitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout?.trim()) {
    console.error('Could not determine the source commit for EAS build verification.');
    process.exit(15);
  }
  return result.stdout.trim();
}
