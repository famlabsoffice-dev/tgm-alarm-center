import type { StorePlatform } from './entitlements';
import type { Tier } from '../domain/alarm';

export interface ServerVerifiedEntitlement {
  status: 'active' | 'expired' | 'revoked' | 'pending';
  tier: Tier;
  productId: string;
  transactionId: string;
  platform: StorePlatform;
  environment: 'sandbox' | 'production';
  expiresAt: string | null;
  updatedAt: string;
}

export interface PurchaseVerificationPayload {
  userId: string;
  platform: StorePlatform;
  productId: string;
  kind: 'subscription' | 'nonConsumable';
  signedTransactionInfo?: string;
  purchaseToken?: string;
}

export async function verifyPurchaseWithServer(endpoint: string, payload: PurchaseVerificationPayload): Promise<ServerVerifiedEntitlement> {
  const response = await fetch(`${endpoint}/v1/verify/purchase`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    throw new Error('Verifikationsdienst lieferte keine gültige Antwort.');
  }
  if (!response.ok || !body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Store-Kauf konnte serverseitig nicht verifiziert werden.');
  const value = (body as Record<string, unknown>).entitlement;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Verifikationsdienst lieferte kein Entitlement.');
  const entitlement = value as Record<string, unknown>;
  if (entitlement.status !== 'active' || typeof entitlement.tier !== 'string' || typeof entitlement.productId !== 'string' || typeof entitlement.transactionId !== 'string' || (entitlement.platform !== 'ios' && entitlement.platform !== 'android') || (entitlement.environment !== 'sandbox' && entitlement.environment !== 'production') || (entitlement.expiresAt !== null && typeof entitlement.expiresAt !== 'string') || typeof entitlement.updatedAt !== 'string') throw new Error('Verifikationsdienst lieferte ein ungültiges Entitlement.');
  return entitlement as ServerVerifiedEntitlement;
}
