import { BillingPeriod, TIER_PRICING, TierPricing } from '../domain/pricing';

export type StorePlatform = 'ios' | 'android';
export type StoreProductKind = 'subscription' | 'nonConsumable';

export interface BillingProduct {
  key: string;
  tier: TierPricing['tier'];
  period: BillingPeriod;
  kind: StoreProductKind;
  iosProductId: string | null;
  androidProductId: string | null;
  displayName: string;
  durationLabel: string;
}

export interface BillingCatalog {
  products: BillingProduct[];
  configured: boolean;
  missingProductKeys: string[];
}

const PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime'];
const PAID_TIERS: TierPricing['tier'][] = ['streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'];
const PERIOD_LABELS: Record<BillingPeriod, string> = {
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  sixMonth: '6 Monate',
  yearly: 'Jährlich',
  lifetime: 'Lifetime',
};

function environment(): Record<string, string | undefined> {
  const processLike = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return processLike?.env ?? {};
}

function configuredId(platform: StorePlatform, tier: string, period: BillingPeriod): string | null {
  const key = `EXPO_PUBLIC_IAP_${platform.toUpperCase()}_${tier.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_${period.toUpperCase()}`;
  const value = environment()[key]?.trim();
  return value ? value : null;
}

function productKey(tier: string, period: BillingPeriod): string {
  return `${tier}.${period}`;
}

function productFor(tier: TierPricing, period: BillingPeriod): BillingProduct {
  return {
    key: productKey(tier.tier, period),
    tier: tier.tier,
    period,
    kind: period === 'lifetime' ? 'nonConsumable' : 'subscription',
    iosProductId: configuredId('ios', tier.tier, period),
    androidProductId: configuredId('android', tier.tier, period),
    displayName: tier.name,
    durationLabel: PERIOD_LABELS[period],
  };
}

export function getBillingCatalog(): BillingCatalog {
  const products = PAID_TIERS.flatMap((tier) => PERIODS.map((period) => productFor(TIER_PRICING[tier], period)));
  const missingProductKeys = products.filter((product) => !product.iosProductId || !product.androidProductId).map((product) => product.key);
  return { products, configured: missingProductKeys.length === 0, missingProductKeys };
}

export function productForKey(key: string): BillingProduct | null {
  return getBillingCatalog().products.find((product) => product.key === key) ?? null;
}

export function storeProductId(product: BillingProduct, platform: StorePlatform): string | null {
  return platform === 'ios' ? product.iosProductId : product.androidProductId;
}

export function billingEnvironmentConfigured(): boolean {
  return getBillingCatalog().configured;
}

export const BILLING_PRODUCT_COUNT = PAID_TIERS.length * PERIODS.length;
