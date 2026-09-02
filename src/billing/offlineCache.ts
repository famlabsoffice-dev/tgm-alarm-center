import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tier } from '../domain/alarm';
import type { StorePlatform } from './entitlements';
import { EMPTY_ENTITLEMENT, type EntitlementSnapshot, isEntitlementUsable } from './entitlements';

export const OFFLINE_ENTITLEMENT_CACHE_KEY = 'tgm-alarm-center-entitlement-cache-v1';
export const OFFLINE_ENTITLEMENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedEntitlement {
  entitlement: EntitlementSnapshot;
  cachedAt: string;
}

export type OfflineCacheStatus = 'usable' | 'expired' | 'empty' | 'invalid';

export interface OfflineEntitlementResult {
  entitlement: EntitlementSnapshot;
  status: OfflineCacheStatus;
  cachedAt: string | null;
}

function isTier(value: unknown): value is Tier {
  return value === 'free' || value === 'streetBoss' || value === 'caporegime' || value === 'underboss' || value === 'boss' || value === 'godfather';
}

function isPlatform(value: unknown): value is StorePlatform {
  return value === 'ios' || value === 'android';
}

function parseCached(value: unknown): CachedEntitlement | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const entitlement = candidate.entitlement;
  const cachedAt = typeof candidate.cachedAt === 'string' && Number.isFinite(Date.parse(candidate.cachedAt))
    ? new Date(candidate.cachedAt).toISOString()
    : null;
  if (!cachedAt || !entitlement || typeof entitlement !== 'object' || Array.isArray(entitlement)) return null;
  const item = entitlement as Record<string, unknown>;
  if (item.source !== 'server' || item.status !== 'active' || !isTier(item.tier) || typeof item.productKey !== 'string' || item.productKey.length === 0 || typeof item.productId !== 'string' || item.productId.length === 0 || !isPlatform(item.platform) || (item.environment !== 'sandbox' && item.environment !== 'production') || typeof item.verifiedAt !== 'string' || !Number.isFinite(Date.parse(item.verifiedAt))) return null;
  const expiresAt = item.expiresAt === null
    ? null
    : typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt))
      ? new Date(item.expiresAt).toISOString()
      : null;
  if (item.expiresAt !== null && expiresAt === null) return null;
  return {
    cachedAt,
    entitlement: {
      status: 'active',
      tier: item.tier,
      productKey: item.productKey,
      productId: item.productId,
      platform: item.platform,
      environment: item.environment,
      expiresAt,
      verifiedAt: new Date(item.verifiedAt).toISOString(),
      source: 'server',
    },
  };
}

export function offlineEntitlementResult(cached: CachedEntitlement | null, at = Date.now()): OfflineEntitlementResult {
  if (!cached) return { entitlement: { ...EMPTY_ENTITLEMENT }, status: 'empty', cachedAt: null };
  const cachedTime = Date.parse(cached.cachedAt);
  const age = at - cachedTime;
  const usable = age >= 0 && age <= OFFLINE_ENTITLEMENT_MAX_AGE_MS && isEntitlementUsable(cached.entitlement, at);
  return {
    entitlement: usable ? { ...cached.entitlement } : { ...EMPTY_ENTITLEMENT, status: 'expired' },
    status: usable ? 'usable' : 'expired',
    cachedAt: cached.cachedAt,
  };
}

export async function readOfflineEntitlement(at = Date.now()): Promise<OfflineEntitlementResult> {
  const raw = await AsyncStorage.getItem(OFFLINE_ENTITLEMENT_CACHE_KEY);
  if (!raw) return offlineEntitlementResult(null, at);
  try {
    const cached = parseCached(JSON.parse(raw) as unknown);
    return cached ? offlineEntitlementResult(cached, at) : { entitlement: { ...EMPTY_ENTITLEMENT }, status: 'invalid', cachedAt: null };
  } catch {
    return { entitlement: { ...EMPTY_ENTITLEMENT }, status: 'invalid', cachedAt: null };
  }
}

export async function writeOfflineEntitlement(entitlement: EntitlementSnapshot, at = Date.now()): Promise<void> {
  if (!isEntitlementUsable(entitlement, at)) throw new Error('Nur aktive serverseitig verifizierte Entitlements dürfen offline gespeichert werden.');
  const cached: CachedEntitlement = { entitlement: { ...entitlement }, cachedAt: new Date(at).toISOString() };
  await AsyncStorage.setItem(OFFLINE_ENTITLEMENT_CACHE_KEY, JSON.stringify(cached));
}

export async function clearOfflineEntitlement(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_ENTITLEMENT_CACHE_KEY);
}
