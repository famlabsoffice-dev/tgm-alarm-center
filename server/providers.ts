import { createSign } from 'node:crypto';
import { productForId, type StoreProduct } from '../src/billing/catalog';
import type { StorePlatform } from '../src/billing/entitlements';
import { SecurityError, verifyAppleJws, verifyGoogleOidcClaims } from './security';
import type { ServerConfig } from './config';

export interface VerifiedPurchase {
  userId: string;
  platform: StorePlatform;
  product: StoreProduct;
  transactionId: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  environment: 'sandbox' | 'production';
  expiresAt: string | null;
}

function findProduct(productId: string): StoreProduct {
  const product = productForId(productId);
  if (!product) throw new SecurityError('Store-Produkt ist nicht im kanonischen Katalog freigegeben.');
  return product;
}

function stringClaim(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) throw new SecurityError(`Fehlender Claim: ${name}`);
  return value;
}

function assertUserBinding(requestedUserId: string, storeUserId: string): void {
  if (requestedUserId !== storeUserId) throw new SecurityError('Store-Kauf ist nicht dem angemeldeten Nutzer zugeordnet.');
}

function signedDate(value: unknown, name: string): string {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw new SecurityError(`Ungültiger Zeitstempel: ${name}`);
  return new Date(value).toISOString();
}

export class ApplePurchaseVerifier {
  constructor(private readonly config: ServerConfig) {}

  verifySignedTransaction(signedTransactionInfo: string, userId: string): VerifiedPurchase {
    const transaction = verifyAppleJws(signedTransactionInfo, this.config.appleRootCertificatePem).payload;
    if (transaction.bundleId !== this.config.appleBundleId) throw new SecurityError('Apple-Bundle-ID stimmt nicht überein.');
    const productId = stringClaim(transaction.productId, 'productId');
    const product = findProduct(productId);
    const storeUserId = typeof transaction.appAccountToken === 'string' && transaction.appAccountToken.length > 0
      ? transaction.appAccountToken
      : stringClaim(transaction.originalTransactionId, 'originalTransactionId');
    assertUserBinding(userId, storeUserId);
    const transactionId = stringClaim(transaction.transactionId, 'transactionId');
    const environment = transaction.environment === 'Sandbox' ? 'sandbox' : transaction.environment === 'Production' ? 'production' : null;
    if (!environment) throw new SecurityError('Apple-Umgebung ist ungültig.');
    const expiresAt = transaction.expiresDate === undefined ? null : signedDate(transaction.expiresDate, 'expiresDate');
    const status: VerifiedPurchase['status'] = transaction.revocationDate !== undefined
      ? 'revoked'
      : expiresAt && Date.parse(expiresAt) <= Date.now()
        ? 'expired'
        : 'active';
    return { userId, platform: 'ios', product, transactionId, status, environment, expiresAt };
  }
}

interface GoogleAccessTokenResponse { access_token?: string; }

function base64UrlJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function googleAccessToken(config: ServerConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64UrlJson({ iss: config.googleServiceAccountEmail, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${signer.sign(config.googleServiceAccountPrivateKeyPem).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString() });
  if (!response.ok) throw new Error(`Google OAuth fehlgeschlagen (${response.status}).`);
  const payload = await response.json() as GoogleAccessTokenResponse;
  if (!payload.access_token) throw new Error('Google OAuth lieferte kein Access-Token.');
  return payload.access_token;
}

async function googleApi(config: ServerConfig, path: string): Promise<Record<string, unknown>> {
  const token = await googleAccessToken(config);
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(config.googlePackageName)}/${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google-Play-Verifikation fehlgeschlagen (${response.status}).`);
  return await response.json() as Record<string, unknown>;
}

export class GooglePurchaseVerifier {
  constructor(private readonly config: ServerConfig) {}

  async verifySubscription(productId: string, purchaseToken: string, userId: string): Promise<VerifiedPurchase> {
    const product = findProduct(productId);
    const payload = await googleApi(this.config, `purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);
    const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item)) : [];
    const lineItem = lineItems.find((item) => item.productId === productId);
    if (!lineItem) throw new SecurityError('Google-Produkt ist nicht Teil des geprüften Abonnements.');
    const accountIdentifiers = payload.externalAccountIdentifiers;
    const storeUserId = accountIdentifiers && typeof accountIdentifiers === 'object' && !Array.isArray(accountIdentifiers)
      ? (accountIdentifiers as Record<string, unknown>).obfuscatedExternalAccountId
      : null;
    assertUserBinding(userId, stringClaim(storeUserId, 'obfuscatedExternalAccountId'));
    const state = payload.subscriptionState;
    const status: VerifiedPurchase['status'] = state === 'SUBSCRIPTION_STATE_ACTIVE' || state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
      ? 'active'
      : state === 'SUBSCRIPTION_STATE_CANCELED' || state === 'SUBSCRIPTION_STATE_EXPIRED'
        ? 'expired'
        : 'pending';
    const expiry = typeof lineItem.expiryTime === 'string' && Number.isFinite(Date.parse(lineItem.expiryTime)) ? new Date(lineItem.expiryTime).toISOString() : null;
    const transactionId = typeof payload.latestOrderId === 'string' ? payload.latestOrderId : purchaseToken;
    return { userId, platform: 'android', product, transactionId, status, environment: 'production', expiresAt: expiry };
  }

  async verifyOneTime(productId: string, purchaseToken: string, userId: string): Promise<VerifiedPurchase> {
    const product = findProduct(productId);
    const payload = await googleApi(this.config, `purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`);
    if (payload.consumptionState !== 0 || payload.purchaseState !== 0) throw new SecurityError('Google-One-Time-Kauf ist nicht aktiv.');
    assertUserBinding(userId, stringClaim(payload.obfuscatedExternalAccountId, 'obfuscatedExternalAccountId'));
    const transactionId = typeof payload.orderId === 'string' ? payload.orderId : purchaseToken;
    return { userId, platform: 'android', product, transactionId, status: 'active', environment: 'production', expiresAt: null };
  }
}

export function decodeGoogleRtdnData(encodedData: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not-object');
    return value as Record<string, unknown>;
  } catch {
    throw new SecurityError('Google-RTDN-Daten sind keine gültige base64-JSON-Payload.');
  }
}

export function verifyGooglePubSubToken(token: string, config: ServerConfig): void {
  const publicKey = process.env.GOOGLE_PUBSUB_OIDC_PUBLIC_KEY_PEM;
  if (!publicKey) throw new SecurityError('GOOGLE_PUBSUB_OIDC_PUBLIC_KEY_PEM ist nicht konfiguriert.');
  verifyGoogleOidcClaims(token, publicKey, config.googlePubSubAudience);
}
