#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const platform = process.argv[2];
const expectedExtension = platform === 'android' ? '.aab' : platform === 'ios' ? '.ipa' : null;

if (!expectedExtension) {
  console.error('Usage: node scripts/verify-production-artifact.mjs android|ios');
  process.exit(2);
}

const artifactCandidates = readdirSync(root)
  .filter((name) => name.toLowerCase().endsWith(expectedExtension))
  .map((name) => resolve(root, name))
  .filter((path) => statSync(path).isFile());

if (artifactCandidates.length !== 1) {
  console.error(`Production artifact verification: FAIL — expected exactly one ${expectedExtension} artifact, found ${artifactCandidates.length}.`);
  process.exit(1);
}

const artifactPath = artifactCandidates[0];
const artifactName = basename(artifactPath);
const artifactBytes = readFileSync(artifactPath);

if (artifactBytes.length < 1024) {
  console.error(`Production artifact verification: FAIL — ${artifactName} is unexpectedly small.`);
  process.exit(1);
}

if (artifactBytes.subarray(0, 2).toString('binary') !== 'PK') {
  console.error(`Production artifact verification: FAIL — ${artifactName} is not a valid ZIP-based application archive.`);
  process.exit(1);
}

try {
  execFileSync('unzip', ['-t', artifactPath], { stdio: 'ignore' });
} catch {
  console.error(`Production artifact verification: FAIL — ZIP integrity check failed for ${artifactName}.`);
  process.exit(1);
}

const sha256 = createHash('sha256').update(artifactBytes).digest('hex');
const checksumPath = `${artifactPath}.sha256`;
writeFileSync(checksumPath, `${sha256}  ${artifactName}\n`, 'utf8');

const metadataPath = join(root, `${platform}-production-artifact-metadata.txt`);
const commit = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const metadata = [
  `Platform: ${platform}`,
  `Artifact: ${artifactName}`,
  `Bytes: ${artifactBytes.length}`,
  `SHA-256: ${sha256}`,
  `Commit: ${commit}`,
  `Verified: ${new Date().toISOString()}`,
].join('\n') + '\n';
writeFileSync(metadataPath, metadata, 'utf8');

console.log('Production artifact verification: PASS');
console.log(`Platform: ${platform}`);
console.log(`Artifact: ${artifactName}`);
console.log(`Bytes: ${artifactBytes.length}`);
console.log(`SHA-256: ${sha256}`);
console.log(`Checksum: ${checksumPath}`);
