import { Platform } from 'react-native';
import { BillingAdapter, StorePurchase, UnconfiguredBillingAdapter } from './adapter';
import { BillingProduct, getBillingCatalog, StorePlatform } from './catalog';
import { getBillingConfiguration } from './config';
import { BillingService, EntitlementVerifier } from './service';

function currentPlatform(): StorePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export class HttpEntitlementVerifier implements EntitlementVerifier {
  constructor(private readonly endpoint: string) {}

  async verify(purchase: StorePurchase, product: BillingProduct): Promise<unknown> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productKey: product.key,
        productId: purchase.productId,
        platform: purchase.platform,
        environment: purchase.environment,
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        raw: purchase.raw,
      }),
    });
    if (!response.ok) throw new Error(`Entitlement-Verifikation fehlgeschlagen (${response.status}).`);
    return response.json() as Promise<unknown>;
  }
}

export function createBillingService(adapter?: BillingAdapter): BillingService {
  const configuration = getBillingConfiguration();
  const selectedAdapter = adapter ?? new UnconfiguredBillingAdapter(currentPlatform());
  const verifier: EntitlementVerifier = configuration.configured && configuration.verificationEndpoint
    ? new HttpEntitlementVerifier(configuration.verificationEndpoint)
    : { verify: async () => { throw new Error('Serverseitige Entitlement-Verifikation ist nicht konfiguriert.'); } };
  return new BillingService(selectedAdapter, verifier, getBillingCatalog());
}

export { BillingService } from './service';
export { getBillingCatalog, productForKey, storeProductId } from './catalog';
export { billingConfigurationIssues, getBillingConfiguration } from './config';
export { EMPTY_ENTITLEMENT, effectiveVerifiedTier, isEntitlementUsable } from './entitlements';
export type { BillingAdapter, StorePurchase, StoreProduct } from './adapter';
export type { BillingCatalog, BillingProduct, StorePlatform } from './catalog';
export type { BillingConfiguration } from './config';
export type { EntitlementSnapshot, EntitlementStatus, VerifiedEntitlement } from './entitlements';
