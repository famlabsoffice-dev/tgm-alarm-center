import { BillingProduct, StorePlatform } from './catalog';

export interface StorePurchase {
  productId: string;
  transactionId: string | null;
  purchaseToken: string | null;
  platform: StorePlatform;
  environment: 'sandbox' | 'production' | 'unknown';
  raw: unknown;
}

export interface StoreProduct {
  productId: string;
  displayPrice: string;
  title: string;
  period: BillingProduct['period'];
  tier: BillingProduct['tier'];
}

export interface BillingAdapter {
  readonly platform: StorePlatform;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchProducts(products: BillingProduct[]): Promise<StoreProduct[]>;
  purchase(product: BillingProduct): Promise<StorePurchase>;
  restorePurchases(): Promise<StorePurchase[]>;
  finishPurchase(purchase: StorePurchase): Promise<void>;
}

export class BillingUnavailableError extends Error {
  constructor(message = 'Store-Billing ist noch nicht konfiguriert.') {
    super(message);
    this.name = 'BillingUnavailableError';
  }
}

export class UnconfiguredBillingAdapter implements BillingAdapter {
  public readonly platform: StorePlatform;

  constructor(platform: StorePlatform) {
    this.platform = platform;
  }

  async connect(): Promise<void> {
    throw new BillingUnavailableError();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async fetchProducts(): Promise<StoreProduct[]> {
    throw new BillingUnavailableError();
  }

  async purchase(): Promise<StorePurchase> {
    throw new BillingUnavailableError('Kein Store-Produkt ist für diese Installation konfiguriert.');
  }

  async restorePurchases(): Promise<StorePurchase[]> {
    throw new BillingUnavailableError();
  }

  async finishPurchase(): Promise<void> {
    throw new BillingUnavailableError();
  }
}
