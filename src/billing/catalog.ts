import type { BillingPeriod } from '../domain/pricing';
import type { Tier } from '../domain/alarm';

export type StoreProductKind = 'subscription' | 'lifetime';
export type StoreProduct = { id: string; tier: Exclude<Tier, 'free'>; period: BillingPeriod; kind: StoreProductKind };

const paidTiers: Array<Exclude<Tier, 'free'>> = ['streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'];
const periods: BillingPeriod[] = ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime'];
const tierSlug: Record<Exclude<Tier, 'free'>, string> = {
  streetBoss: 'street_boss',
  caporegime: 'caporegime',
  underboss: 'underboss',
  boss: 'boss',
  godfather: 'godfather',
};

export const STORE_PRODUCTS: StoreProduct[] = paidTiers.flatMap((tier) => periods.map((period) => ({
  id: `com.tgm.alarmcenter.${tierSlug[tier]}_${period === 'sixMonth' ? 'six_month' : period}`,
  tier,
  period,
  kind: period === 'lifetime' ? 'lifetime' : 'subscription',
})));

export const STORE_PRODUCT_IDS = STORE_PRODUCTS.map((product) => product.id);
export const STORE_SUBSCRIPTION_IDS = STORE_PRODUCTS.filter((product) => product.kind === 'subscription').map((product) => product.id);
export const STORE_LIFETIME_IDS = STORE_PRODUCTS.filter((product) => product.kind === 'lifetime').map((product) => product.id);

export function productForId(productId: string): StoreProduct | null {
  return STORE_PRODUCTS.find((product) => product.id === productId) ?? null;
}

export function highestTier(products: Iterable<string>): Tier {
  const rank: Tier[] = ['free', 'streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'];
  let best: Tier = 'free';
  for (const productId of products) {
    const product = productForId(productId);
    if (product && rank.indexOf(product.tier) > rank.indexOf(best)) best = product.tier;
  }
  return best;
}
