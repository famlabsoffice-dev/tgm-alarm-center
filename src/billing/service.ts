import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillingAdapter, BillingUnavailableError, StorePurchase, StoreProduct } from './adapter';
import { BillingCatalog, BillingProduct, productForKey, storeProductId } from './catalog';
import { EMPTY_ENTITLEMENT, EntitlementSnapshot, normalizeVerifiedEntitlement, VerifiedEntitlement } from './entitlements';

export const ENTITLEMENT_STORAGE_KEY = 'tgm-alarm-center-entitlement-v1';

export interface EntitlementVerifier {
  verify(purchase: StorePurchase, product: BillingProduct): Promise<unknown>;
}

export class UnconfiguredEntitlementVerifier implements EntitlementVerifier {
  async verify(): Promise<unknown> {
    throw new BillingUnavailableError('Serverseitige Entitlement-Verifikation ist noch nicht konfiguriert.');
  }
}

export interface BillingState {
  connected: boolean;
  loading: boolean;
  products: StoreProduct[];
  entitlement: EntitlementSnapshot;
  error: string | null;
}

export const initialBillingState = (): BillingState => ({
  connected: false,
  loading: false,
  products: [],
  entitlement: { ...EMPTY_ENTITLEMENT },
  error: null,
});

export class BillingService {
  constructor(
    private readonly adapter: BillingAdapter,
    private readonly verifier: EntitlementVerifier,
    private readonly catalog: BillingCatalog,
  ) {}

  async loadPersistedEntitlement(): Promise<EntitlementSnapshot> {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_STORAGE_KEY);
    if (!raw) return { ...EMPTY_ENTITLEMENT };
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY_ENTITLEMENT };
      const value = parsed as Partial<EntitlementSnapshot>;
      if (value.source !== 'server' || typeof value.productKey !== 'string') return { ...EMPTY_ENTITLEMENT };
      const product = productForKey(value.productKey);
      const platform = value.platform;
      if (!product || (platform !== 'ios' && platform !== 'android')) return { ...EMPTY_ENTITLEMENT };
      const normalized = normalizeVerifiedEntitlement(value, product, platform);
      return normalized ? { ...normalized } : { ...EMPTY_ENTITLEMENT };
    } catch {
      return { ...EMPTY_ENTITLEMENT };
    }
  }

  async connect(): Promise<void> {
    if (!this.catalog.configured) throw new BillingUnavailableError('Store-Produktkatalog ist unvollständig konfiguriert.');
    await this.adapter.connect();
  }

  async fetchProducts(): Promise<StoreProduct[]> {
    if (!this.catalog.configured) throw new BillingUnavailableError('Store-Produktkatalog ist unvollständig konfiguriert.');
    return this.adapter.fetchProducts(this.catalog.products);
  }

  async purchase(productKey: string, userId: string): Promise<VerifiedEntitlement> {
    const product = productForKey(productKey);
    if (!product) throw new Error('Unbekanntes Billing-Produkt.');
    const productId = storeProductId(product, this.adapter.platform);
    if (!productId) throw new BillingUnavailableError('Dieses Produkt ist für die aktuelle Plattform nicht konfiguriert.');
    const purchase = await this.adapter.purchase(product, userId);
    if (purchase.productId !== productId) throw new Error('Store-Produkt stimmt nicht mit dem angeforderten Tier überein.');
    const verifiedPayload = await this.verifier.verify(purchase, product);
    const verified = normalizeVerifiedEntitlement(verifiedPayload, product, this.adapter.platform);
    if (!verified || verified.status !== 'active') throw new Error('Der Kauf konnte nicht als aktives Entitlement verifiziert werden.');
    await this.adapter.finishPurchase(purchase);
    await this.persist(verified);
    return verified;
  }

  async restorePurchases(): Promise<VerifiedEntitlement[]> {
    const purchases = await this.adapter.restorePurchases();
    const verifiedEntitlements: VerifiedEntitlement[] = [];
    for (const purchase of purchases) {
      const product = this.catalog.products.find((candidate) => storeProductId(candidate, this.adapter.platform) === purchase.productId);
      if (!product) continue;
      const verifiedPayload = await this.verifier.verify(purchase, product);
      const verified = normalizeVerifiedEntitlement(verifiedPayload, product, this.adapter.platform);
      if (!verified) continue;
      await this.adapter.finishPurchase(purchase);
      verifiedEntitlements.push(verified);
    }
    const strongest = verifiedEntitlements.sort((a, b) => tierRank(b.tier) - tierRank(a.tier))[0] ?? null;
    if (strongest) await this.persist(strongest);
    return verifiedEntitlements;
  }

  private async persist(entitlement: VerifiedEntitlement): Promise<void> {
    await AsyncStorage.setItem(ENTITLEMENT_STORAGE_KEY, JSON.stringify(entitlement));
  }
}

function tierRank(tier: VerifiedEntitlement['tier']): number {
  return ({ free: 0, streetBoss: 1, caporegime: 2, underboss: 3, boss: 4, godfather: 5 })[tier];
}
