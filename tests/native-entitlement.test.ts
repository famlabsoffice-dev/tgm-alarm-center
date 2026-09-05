import assert from 'node:assert/strict';
import test from 'node:test';
import { TIER_LIMITS } from '../src/domain/alarm';
import { clearVerifiedNativeEntitlement, getNativeEntitlementState, setVerifiedNativeEntitlement } from '../src/billing/nativeEntitlementService';

test('persisted paid tier cannot unlock native features without verified entitlement', () => {
  clearVerifiedNativeEntitlement();
  const state = getNativeEntitlementState('ordinary-player', 'godfather');
  assert.equal(state.tier, 'free');
  assert.equal(state.source, 'none');
  assert.equal(TIER_LIMITS[state.tier].alarms, TIER_LIMITS.free.alarms);
});

test('only active unexpired server entitlement unlocks native premium features', () => {
  clearVerifiedNativeEntitlement();
  const active = { status: 'active' as const, tier: 'streetBoss' as const, productKey: 'street-boss-monthly', productId: 'street-boss-monthly', platform: 'android' as const, environment: 'production' as const, expiresAt: '2026-09-06T00:00:00.000Z', verifiedAt: '2026-09-05T00:00:00.000Z', source: 'server' as const };
  setVerifiedNativeEntitlement(active);
  assert.equal(getNativeEntitlementState('ordinary-player', 'free').tier, 'streetBoss');

  setVerifiedNativeEntitlement({ ...active, status: 'expired', expiresAt: '2026-09-04T00:00:00.000Z' });
  assert.equal(getNativeEntitlementState('ordinary-player', 'godfather').tier, 'free');

  setVerifiedNativeEntitlement({ ...active, status: 'pending', expiresAt: '2026-09-06T00:00:00.000Z' });
  assert.equal(getNativeEntitlementState('ordinary-player', 'godfather').tier, 'free');

  setVerifiedNativeEntitlement({ ...active, status: 'revoked', expiresAt: '2026-09-06T00:00:00.000Z' });
  assert.equal(getNativeEntitlementState('ordinary-player', 'godfather').tier, 'free');
  clearVerifiedNativeEntitlement();
});

test('Founder test access remains isolated from persisted tier and server entitlement state', () => {
  clearVerifiedNativeEntitlement();
  const founder = getNativeEntitlementState('TGMack', 'free');
  assert.equal(founder.tier, 'godfather');
  assert.equal(founder.source, 'founder-test');
  const mixedCase = getNativeEntitlementState(' tgmvany ', 'free');
  assert.equal(mixedCase.tier, 'godfather');
  assert.equal(mixedCase.source, 'founder-test');
});
