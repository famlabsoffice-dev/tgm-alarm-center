import { createHash } from 'node:crypto';
import type { StoreProduct } from '../src/billing/catalog';
import type { ServerConfig } from './config';
import { ApplePurchaseVerifier, decodeGoogleRtdnData, GooglePurchaseVerifier, type VerifiedPurchase, verifyGooglePubSubToken } from './providers';
import { BillingRepository, type StoredEntitlement, type StoredWebhookEvent } from './repository';
import { SecurityError, verifyAppleJws } from './security';

export interface PurchaseVerificationRequest {
  userId: string;
  platform: 'ios' | 'android';
  productId: string;
  kind: 'subscription' | 'nonConsumable';
  signedTransactionInfo?: string;
  purchaseToken?: string;
}

function stringField(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 4096) throw new SecurityError(`Ungültiges Feld: ${field}`);
  return value.trim();
}

function statusFromAppleNotification(notificationType: string, subtype: string | null): VerifiedPurchase['status'] {
  if (notificationType === 'REVOKE' || notificationType === 'REFUND') return 'revoked';
  if (notificationType === 'EXPIRED' || notificationType === 'GRACE_PERIOD_EXPIRED') return 'expired';
  if (notificationType === 'DID_FAIL_TO_RENEW' && subtype === 'GRACE_PERIOD') return 'pending';
  return 'active';
}

function entitlementFromPurchase(purchase: VerifiedPurchase, sourceEventId: string, purchaseToken: string | null): StoredEntitlement {
  return {
    userId: purchase.userId,
    platform: purchase.platform,
    productId: purchase.product.id,
    productKey: purchase.product.id,
    tier: purchase.product.tier,
    transactionId: purchase.transactionId,
    purchaseToken,
    status: purchase.status,
    environment: purchase.environment,
    expiresAt: purchase.expiresAt,
    updatedAt: new Date().toISOString(),
    sourceEventId,
  };
}

function assertProduct(product: StoreProduct, productId: string): void {
  if (product.id !== productId) throw new SecurityError('Verifiziertes Produkt stimmt nicht mit der Anfrage überein.');
}

const processingEventIds = new Set<string>();

async function claimEvent(repository: BillingRepository, eventId: string): Promise<boolean> {
  if (await repository.hasEvent(eventId)) return false;
  if (processingEventIds.has(eventId)) return false;
  processingEventIds.add(eventId);
  return true;
}

function releaseEvent(eventId: string): void {
  processingEventIds.delete(eventId);
}

async function persistProcessedEvent(repository: BillingRepository, event: StoredWebhookEvent): Promise<void> {
  await repository.recordEvent(event);
}

export class BillingWebhookService {
  private readonly apple: ApplePurchaseVerifier;
  private readonly google: GooglePurchaseVerifier;

  constructor(private readonly config: ServerConfig, private readonly repository: BillingRepository) {
    this.apple = new ApplePurchaseVerifier(config);
    this.google = new GooglePurchaseVerifier(config);
  }

  async verifyPurchase(request: PurchaseVerificationRequest): Promise<StoredEntitlement> {
    const userId = stringField(request.userId, 'userId');
    const productId = stringField(request.productId, 'productId');
    let purchase: VerifiedPurchase;
    let purchaseToken: string | null = null;
    if (request.platform === 'ios') {
      if (!request.signedTransactionInfo) throw new SecurityError('Apple benötigt signedTransactionInfo.');
      purchase = this.apple.verifySignedTransaction(request.signedTransactionInfo, userId);
    } else {
      purchaseToken = stringField(request.purchaseToken, 'purchaseToken');
      purchase = request.kind === 'subscription'
        ? await this.google.verifySubscription(productId, purchaseToken, userId)
        : await this.google.verifyOneTime(productId, purchaseToken, userId);
    }
    assertProduct(purchase.product, productId);
    const entitlement = entitlementFromPurchase(purchase, `purchase:${purchase.transactionId}`, purchaseToken);
    if (entitlement.status !== 'active') throw new SecurityError('Nur aktive Store-Entitlements dürfen freigeschaltet werden.');
    await this.repository.upsertEntitlement(entitlement);
    return entitlement;
  }

  async receiveAppleNotification(body: unknown): Promise<'processed' | 'duplicate'> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SecurityError('Apple-Webhook-Payload ist ungültig.');
    const signedPayload = stringField((body as Record<string, unknown>).signedPayload, 'signedPayload');
    const notification = verifyAppleJws(signedPayload, this.config.appleRootCertificatePem);
    const payload = notification.payload;
    if (payload.bundleId !== this.config.appleBundleId) throw new SecurityError('Apple-Bundle-ID stimmt nicht überein.');
    const eventId = stringField(payload.notificationUUID, 'notificationUUID');
    if (!(await claimEvent(this.repository, eventId))) return 'duplicate';
    try {
      const data = payload.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        await persistProcessedEvent(this.repository, { eventId, platform: 'ios', receivedAt: new Date().toISOString(), payloadDigest: notification.digest });
        return 'processed';
      }
      const signedTransactionInfo = (data as Record<string, unknown>).signedTransactionInfo;
      if (typeof signedTransactionInfo !== 'string') {
        await persistProcessedEvent(this.repository, { eventId, platform: 'ios', receivedAt: new Date().toISOString(), payloadDigest: notification.digest });
        return 'processed';
      }
      const transaction = verifyAppleJws(signedTransactionInfo, this.config.appleRootCertificatePem).payload;
      const userId = typeof transaction.appAccountToken === 'string' && transaction.appAccountToken.length > 0
        ? transaction.appAccountToken
        : stringField(transaction.originalTransactionId, 'originalTransactionId');
      const verified = this.apple.verifySignedTransaction(signedTransactionInfo, userId);
      const notificationType = typeof payload.notificationType === 'string' ? payload.notificationType : 'DID_CHANGE_RENEWAL_STATUS';
      const subtype = typeof payload.subtype === 'string' ? payload.subtype : null;
      const status = statusFromAppleNotification(notificationType, subtype);
      await this.repository.upsertEntitlement(entitlementFromPurchase({ ...verified, status }, eventId, null));
      await persistProcessedEvent(this.repository, { eventId, platform: 'ios', receivedAt: new Date().toISOString(), payloadDigest: notification.digest });
      return 'processed';
    } finally {
      releaseEvent(eventId);
    }
  }

  async receiveGoogleNotification(oidcToken: string, body: unknown): Promise<'processed' | 'duplicate'> {
    verifyGooglePubSubToken(oidcToken, this.config);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SecurityError('Google-Pub/Sub-Payload ist ungültig.');
    const message = (body as Record<string, unknown>).message;
    if (!message || typeof message !== 'object' || Array.isArray(message)) throw new SecurityError('Google-Pub/Sub-Nachricht fehlt.');
    const messageObject = message as Record<string, unknown>;
    const messageId = stringField(messageObject.messageId, 'messageId');
    const encodedData = stringField(messageObject.data, 'data');
    const eventId = `google:${messageId}`;
    if (!(await claimEvent(this.repository, eventId))) return 'duplicate';
    try {
      const digest = createHash('sha256').update(encodedData).digest('hex');
      const data = decodeGoogleRtdnData(encodedData);
      const voided = data.voidedPurchaseNotification;
      if (voided && typeof voided === 'object' && !Array.isArray(voided)) {
        const token = (voided as Record<string, unknown>).purchaseToken;
        if (typeof token === 'string') {
          const existingUser = await this.repository.findUserByPurchaseToken(token);
          if (existingUser) {
            const entitlements = await this.repository.entitlementsForUser(existingUser);
            for (const entitlement of entitlements.filter((candidate) => candidate.purchaseToken === token)) await this.repository.upsertEntitlement({ ...entitlement, status: 'revoked', updatedAt: new Date().toISOString(), sourceEventId: eventId });
          }
        }
        await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
        return 'processed';
      }
      const subscription = data.subscriptionNotification;
      if (subscription && typeof subscription === 'object' && !Array.isArray(subscription)) {
        const token = stringField((subscription as Record<string, unknown>).purchaseToken, 'purchaseToken');
        const notificationType = Number((subscription as Record<string, unknown>).notificationType);
        const existingUser = await this.repository.findUserByPurchaseToken(token);
        if (!existingUser) {
          await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
          return 'processed';
        }
        const existing = (await this.repository.entitlementsForUser(existingUser)).find((candidate) => candidate.purchaseToken === token);
        if (!existing) {
          await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
          return 'processed';
        }
        const verified = await this.google.verifySubscription(existing.productId, token, existingUser);
        const status: VerifiedPurchase['status'] = notificationType === 13 || notificationType === 12 ? 'expired' : notificationType === 3 || notificationType === 5 ? 'pending' : verified.status;
        await this.repository.upsertEntitlement({ ...entitlementFromPurchase({ ...verified, status }, eventId, token), userId: existingUser });
        await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
        return 'processed';
      }
      const oneTime = data.oneTimeProductNotification;
      if (oneTime && typeof oneTime === 'object' && !Array.isArray(oneTime)) {
        const token = stringField((oneTime as Record<string, unknown>).purchaseToken, 'purchaseToken');
        const existingUser = await this.repository.findUserByPurchaseToken(token);
        if (!existingUser) {
          await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
          return 'processed';
        }
        const productId = stringField((oneTime as Record<string, unknown>).sku, 'sku');
        const verified = await this.google.verifyOneTime(productId, token, existingUser);
        await this.repository.upsertEntitlement(entitlementFromPurchase(verified, eventId, token));
      }
      await persistProcessedEvent(this.repository, { eventId, platform: 'android', receivedAt: new Date().toISOString(), payloadDigest: digest });
      return 'processed';
    } finally {
      releaseEvent(eventId);
    }
  }
}
