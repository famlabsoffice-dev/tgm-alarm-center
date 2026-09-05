import type { Tier } from '../domain/alarm';
import { isFounderAccountName } from '../domain/pricing';
import { EMPTY_ENTITLEMENT, effectiveVerifiedTier, type EntitlementSnapshot } from './entitlements';

export type NativeEntitlementSource = 'founder-test' | 'verified-server' | 'none';

export interface NativeEntitlementState {
  tier: Tier;
  source: NativeEntitlementSource;
  entitlement: EntitlementSnapshot;
}

let verifiedEntitlement: EntitlementSnapshot = { ...EMPTY_ENTITLEMENT };

export function setVerifiedNativeEntitlement(entitlement: EntitlementSnapshot): void {
  verifiedEntitlement = { ...entitlement };
}

export function clearVerifiedNativeEntitlement(): void {
  verifiedEntitlement = { ...EMPTY_ENTITLEMENT };
}

export function getNativeEntitlementState(accountName: string, _persistedTier: Tier): NativeEntitlementState {
  if (isFounderAccountName(accountName)) {
    return { tier: 'godfather', source: 'founder-test', entitlement: { ...EMPTY_ENTITLEMENT } };
  }
  const tier = effectiveVerifiedTier(verifiedEntitlement);
  return {
    tier,
    source: tier === 'free' ? 'none' : 'verified-server',
    entitlement: { ...verifiedEntitlement },
  };
}

export function trustedNativeTier(accountName: string, persistedTier: Tier): Tier {
  return getNativeEntitlementState(accountName, persistedTier).tier;
}
