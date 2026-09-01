import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts as iapFetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as iapRestorePurchases,
  type Purchase,
} from 'expo-iap';
import { BillingAdapter, BillingUnavailableError, StoreProduct, StorePurchase } from './adapter';
import { BillingProduct, StorePlatform, storeProductId } from './catalog';

type PendingPurchase = {
  resolve: (purchase: StorePurchase) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function purchaseId(purchase: Purchase): string | null {
  const value = record(purchase);
  return text(value.productId);
}

function purchaseEnvironment(purchase: Purchase): StorePurchase['environment'] {
  const value = text(record(purchase).environmentIOS);
  if (value?.toLowerCase() === 'sandbox') return 'sandbox';
  if (value?.toLowerCase() === 'production') return 'production';
  return Platform.OS === 'android' ? 'production' : 'unknown';
}

function normalizePurchase(purchase: Purchase, platform: StorePlatform): StorePurchase {
  const value = record(purchase);
  const productId = text(value.productId);
  if (!productId) throw new BillingUnavailableError('Store-Kauf enthält keine Produkt-ID.');
  return {
    productId,
    transactionId: text(value.transactionId) ?? text(value.id),
    purchaseToken: text(value.purchaseToken),
    platform,
    userId: platform === 'ios' ? text(value.appAccountToken) : text(value.obfuscatedAccountIdAndroid),
    environment: purchaseEnvironment(purchase),
    raw: purchase,
  };
}

export class ExpoIapBillingAdapter implements BillingAdapter {
  public readonly platform: StorePlatform = Platform.OS === 'ios' ? 'ios' : 'android';
  private connected = false;
  private updateSubscription: { remove: () => void } | null = null;
  private errorSubscription: { remove: () => void } | null = null;
  private readonly pending = new Map<string, PendingPurchase>();

  async connect(): Promise<void> {
    if (this.connected) return;
    await initConnection();
    this.updateSubscription = purchaseUpdatedListener((purchase) => this.handlePurchaseUpdate(purchase));
    this.errorSubscription = purchaseErrorListener((error) => this.handlePurchaseError(error));
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.updateSubscription?.remove();
    this.errorSubscription?.remove();
    this.updateSubscription = null;
    this.errorSubscription = null;
    for (const [productId, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`Kauf für ${productId} wurde beendet.`));
    }
    this.pending.clear();
    if (this.connected) await endConnection();
    this.connected = false;
  }

  async fetchProducts(products: BillingProduct[]): Promise<StoreProduct[]> {
    this.assertConnected();
    const subscriptions = products.filter((product) => product.kind === 'subscription');
    const nonConsumables = products.filter((product) => product.kind === 'nonConsumable');
    const results: StoreProduct[] = [];
    if (subscriptions.length > 0) {
      const fetched = await iapFetchProducts({ skus: subscriptions.map((product) => this.requireProductId(product)), type: 'subs' });
      results.push(...this.normalizeProducts(fetched, subscriptions));
    }
    if (nonConsumables.length > 0) {
      const fetched = await iapFetchProducts({ skus: nonConsumables.map((product) => this.requireProductId(product)), type: 'in-app' });
      results.push(...this.normalizeProducts(fetched, nonConsumables));
    }
    return results;
  }

  async purchase(product: BillingProduct, userId: string): Promise<StorePurchase> {
    this.assertConnected();
    const productId = this.requireProductId(product);
    const purchasePromise = new Promise<StorePurchase>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(productId);
        reject(new Error('Der Store hat innerhalb des Zeitlimits keine Kaufbestätigung geliefert.'));
      }, 120000);
      this.pending.set(productId, { resolve, reject, timer });
    });
    try {
      await requestPurchase({
        type: product.kind === 'subscription' ? 'subs' : 'in-app',
        request: this.platform === 'ios' ? { apple: { sku: productId, appAccountToken: userId, andDangerouslyFinishTransactionAutomatically: false } } : { google: { skus: [productId], obfuscatedAccountId: userId, obfuscatedProfileId: userId } },
      });
      return await purchasePromise;
    } catch (error: unknown) {
      const pending = this.pending.get(productId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(productId);
        pending.reject(error instanceof Error ? error : new Error('Store-Kauf konnte nicht gestartet werden.'));
      }
      throw error instanceof Error ? error : new Error('Store-Kauf konnte nicht gestartet werden.');
    }
  }

  async restorePurchases(): Promise<StorePurchase[]> {
    this.assertConnected();
    await iapRestorePurchases();
    const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true, includeSuspendedAndroid: false });
    return purchases.map((purchase) => normalizePurchase(purchase, this.platform));
  }

  async finishPurchase(purchase: StorePurchase): Promise<void> {
    this.assertConnected();
    const raw = purchase.raw as Purchase;
    await finishTransaction({ purchase: raw, isConsumable: false });
  }

  private handlePurchaseUpdate(purchase: Purchase): void {
    if (purchase.purchaseState !== 'purchased') return;
    const productId = purchaseId(purchase);
    if (!productId) return;
    const pending = this.pending.get(productId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(productId);
    try {
      pending.resolve(normalizePurchase(purchase, this.platform));
    } catch (error: unknown) {
      pending.reject(error instanceof Error ? error : new Error('Store-Kauf ist ungültig.'));
    }
  }

  private handlePurchaseError(error: { productId?: string | null; message?: string }): void {
    const productId = text(record(error).productId);
    const message = error.message || 'Store-Kauf ist fehlgeschlagen.';
    if (productId) {
      const pending = this.pending.get(productId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(productId);
      pending.reject(new Error(message));
      return;
    }
    for (const [key, pending] of this.pending) {
      clearTimeout(pending.timer);
      this.pending.delete(key);
      pending.reject(new Error(message));
    }
  }

  private normalizeProducts(fetched: unknown, products: BillingProduct[]): StoreProduct[] {
    if (!Array.isArray(fetched)) return [];
    const byId = new Map(products.map((product) => [this.requireProductId(product), product]));
    return fetched.flatMap((value) => {
      const item = record(value);
      const productId = text(item.id);
      const product = productId ? byId.get(productId) : undefined;
      if (!product || !productId) return [];
      return [{ productId, displayPrice: text(item.displayPrice) ?? text(item.price) ?? 'Preis im Store', title: text(item.title) ?? product.displayName, period: product.period, tier: product.tier }];
    });
  }

  private requireProductId(product: BillingProduct): string {
    const productId = storeProductId(product, this.platform);
    if (!productId) throw new BillingUnavailableError(`Produkt ${product.key} ist für ${this.platform} nicht konfiguriert.`);
    return productId;
  }

  private assertConnected(): void {
    if (!this.connected) throw new BillingUnavailableError('Store-Verbindung ist nicht geöffnet.');
  }
}
