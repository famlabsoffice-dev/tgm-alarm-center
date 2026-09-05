import assert from 'node:assert/strict';
import test from 'node:test';
import { assertOwnerAccess, authorizeOwnerAccess, type AuthenticatedOwner } from '../src/billing/ownerAuthorization';

const validIdentity: AuthenticatedOwner = { subject: 'user-123', issuedAt: '2026-09-05T00:00:00.000Z', expiresAt: '2026-09-05T01:00:00.000Z' };
const now = new Date('2026-09-05T00:30:00.000Z');

test('missing identity fails closed as unauthenticated', () => {
  assert.equal(authorizeOwnerAccess(null, 'user-123', now), 'unauthenticated');
  assert.throws(() => assertOwnerAccess(null, 'user-123', now), /401 UNAUTHENTICATED/);
});

test('expired identity fails closed as unauthenticated', () => {
  const expired = { ...validIdentity, expiresAt: '2026-09-05T00:29:59.999Z' };
  assert.equal(authorizeOwnerAccess(expired, 'user-123', now), 'unauthenticated');
});

test('foreign owner access fails closed as forbidden', () => {
  assert.equal(authorizeOwnerAccess(validIdentity, 'user-456', now), 'forbidden');
  assert.throws(() => assertOwnerAccess(validIdentity, 'user-456', now), /403 FORBIDDEN/);
});

test('matching authenticated owner is authorized', () => {
  assert.deepEqual(authorizeOwnerAccess(validIdentity, 'user-123', now), { authorized: true, ownerId: 'user-123' });
});
