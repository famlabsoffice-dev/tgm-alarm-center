import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync, createSign } from 'node:crypto';
import test from 'node:test';
import { SecurityError, verifyGoogleOidcClaims } from '../server/security';
import { BillingRepository } from '../server/repository';

function token(privateKey: string, claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  return `${header}.${body}.${signer.sign(privateKey).toString('base64url')}`;
}

test('accepts a valid Google Pub/Sub OIDC token', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const signed = token(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), {
    iss: 'https://accounts.google.com',
    aud: 'https://billing.example.test/google-rtdn',
    iat: now - 10,
    exp: now + 300,
  });
  const verified = verifyGoogleOidcClaims(signed, publicKey.export({ type: 'spki', format: 'pem' }).toString(), 'https://billing.example.test/google-rtdn', now);
  assert.equal(verified.claims.aud, 'https://billing.example.test/google-rtdn');
  assert.equal(verified.header.alg, 'RS256');
});

test('rejects a Google Pub/Sub token with a wrong audience', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const signed = token(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), {
    iss: 'https://accounts.google.com',
    aud: 'https://attacker.example.test',
    iat: now - 10,
    exp: now + 300,
  });
  assert.throws(() => verifyGoogleOidcClaims(signed, publicKey.export({ type: 'spki', format: 'pem' }).toString(), 'https://billing.example.test/google-rtdn', now), SecurityError);
});

test('records each webhook event only once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tgm-billing-'));
  const repository = new BillingRepository(join(directory, 'store.json'));
  const event = { eventId: 'apple:event-1', platform: 'ios' as const, receivedAt: '2030-01-01T00:00:00.000Z', payloadDigest: 'digest' };
  try {
    assert.equal(await repository.recordEvent(event), true);
    assert.equal(await repository.recordEvent(event), false);
    assert.equal(await repository.hasEvent(event.eventId), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
