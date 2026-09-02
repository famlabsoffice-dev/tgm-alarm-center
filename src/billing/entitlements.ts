import type { Tier } from '../domain/alarm';
import type { StoreProduct } from './catalog';

export type StorePlatform = 'ios' | 'android';
export type StoreEnvironment = 'sandbox' | 'production' | 'unknown';
export type EntitlementStatus = 'active' | 'expired' | 'pending' | 'revoked' | 'unverified' | 'unavailable';

export interface VerifiedEntitlement {
  status: EntitlementStatus;
  tier: Tier;
  productKey: string;
  productId: string;
  transactionId: string | null;
  platform: StorePlatform;
  environment: StoreEnvironment;
  expiresAt: string | null;
  verifiedAt: string;
  source: 'server';
}

export interface EntitlementSnapshot {
  status: EntitlementStatus;
  tier: Tier;
  productKey: string | null;
  productId: string | null;
  platform: StorePlatform | null;
  environment: StoreEnvironment;
  expiresAt: string | null;
  verifiedAt: string | null;
  source: 'server' | 'none';
}

export const EMPTY_ENTITLEMENT: EntitlementSnapshot = {
  status: 'unavailable',
  tier: 'free',
  productKey: null,
  productId: null,
  platform: null,
  environment: 'unknown',
  expiresAt: null,
  verifiedAt: null,
  source: 'none',
};

export function isEntitlementUsable(entitlement: EntitlementSnapshot, at = Date.now()): boolean {
  if (entitlement.source !== 'server' || entitlement.status !== 'active') return false;
  if (entitlement.expiresAt === null) return true;
  const expiry = Date.parse(entitlement.expiresAt);
  return Number.isFinite(expiry) && expiry > at;
}

export function effectiveVerifiedTier(entitlement: EntitlementSnapshot, at = Date.now()): Tier {
  return isEntitlementUsable(entitlement, at) ? entitlement.tier : 'free';
}

export function normalizeVerifiedEntitlement(value: unknown, product: StoreProduct, platform: StorePlatform): VerifiedEntitlement | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const expectedProductId = product.id;
  const productId = typeof candidate.productId === 'string' ? candidate.productId : null;
  const verifiedAt = typeof candidate.verifiedAt === 'string' && Number.isFinite(Date.parse(candidate.verifiedAt))
    ? new Date(candidate.verifiedAt).toISOString()
    : null;
  const status = candidate.status === 'active' || candidate.status === 'expired' || candidate.status === 'pending' || candidate.status === 'revoked'
    ? candidate.status
    : null;
  if (!productId || productId !== expectedProductId || !status || !verifiedAt) return null;
  const expiresAt = candidate.expiresAt === null
    ? null
    : typeof candidate.expiresAt === 'string' && Number.isFinite(Date.parse(candidate.expiresAt))
      ? new Date(candidate.expiresAt).toISOString()
      : null;
  if (candidate.expiresAt !== null && expiresAt === null) return null;
  return {
    status,
    tier: product.tier,
    productKey: product.id,
    productId,
    transactionId: typeof candidate.transactionId === 'string' ? candidate.transactionId : null,
    platform,
    environment: candidate.environment === 'sandbox' || candidate.environment === 'production' ? candidate.environment : 'unknown',
    expiresAt,
    verifiedAt,
    source: 'server',
  };
}
