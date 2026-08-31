import type { Tier } from './alarm';

export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';

export interface TierPricing {
  tier: Tier;
  name: string;
  limits: {
    accounts: number;
    alarms: number;
    events: number;
  };
  eur: Record<BillingPeriod, number>;
  usdDirect: Record<BillingPeriod, number>;
  usdStore: Record<Exclude<BillingPeriod, 'monthly'> | 'monthly', number>;
  annualSavingPercent: number | null;
}

/**
 * Central commercial configuration.
 * EUR target prices are authoritative; USD store prices are the recommended
 * conversion-optimized public list prices.
 */
export const TIER_PRICING: Record<Tier, TierPricing> = {
  free: {
    tier: 'free',
    name: 'Free',
    limits: { accounts: 1, alarms: 1, events: 1 },
    eur: { monthly: 0, yearly: 0, lifetime: 0 },
    usdDirect: { monthly: 0, yearly: 0, lifetime: 0 },
    usdStore: { monthly: 0, yearly: 0, lifetime: 0 },
    annualSavingPercent: null,
  },
  streetBoss: {
    tier: 'streetBoss',
    name: 'Street Boss',
    limits: { accounts: 2, alarms: 2, events: 2 },
    eur: { monthly: 4.99, yearly: 39.99, lifetime: 79.99 },
    usdDirect: { monthly: 5.79, yearly: 46.39, lifetime: 92.79 },
    usdStore: { monthly: 4.99, yearly: 44.99, lifetime: 89.99 },
    annualSavingPercent: 25,
  },
  caporegime: {
    tier: 'caporegime',
    name: 'Caporegime',
    limits: { accounts: 3, alarms: 3, events: 3 },
    eur: { monthly: 7.99, yearly: 69.99, lifetime: 129.99 },
    usdDirect: { monthly: 9.27, yearly: 81.19, lifetime: 150.79 },
    usdStore: { monthly: 9.99, yearly: 79.99, lifetime: 149.99 },
    annualSavingPercent: 33,
  },
  godfather: {
    tier: 'godfather',
    name: 'Godfather',
    limits: {
      accounts: Number.POSITIVE_INFINITY,
      alarms: Number.POSITIVE_INFINITY,
      events: Number.POSITIVE_INFINITY,
    },
    eur: { monthly: 12.99, yearly: 99.99, lifetime: 199.99 },
    usdDirect: { monthly: 15.07, yearly: 115.99, lifetime: 231.99 },
    usdStore: { monthly: 14.99, yearly: 119.99, lifetime: 229.99 },
    annualSavingPercent: 33,
  },
};

export const STORE_PRICING_NOTES = {
  usdStorePricing:
    'Recommended conversion-optimized USD list prices for App Store / Google Play.',
  streetBossMonthlyAlternativeUsd: 5.99,
  streetBossMonthlyAlternativeReason:
    'Optional alternative when the USD list price should stay closer to the EUR equivalent.',
  eurAuthority:
    'EUR target prices remain the central pricing configuration.',
} as const;

export const VALUE_GUIDANCE = {
  freeUser: {
    purchasePriceUsd: 0,
    estimatedPreventedIncidentValueUsd: { min: 5, max: 50 },
    description:
      'Zeitwert eines verhinderten verpassten Bubble/GW-Events kann deutlich über dem Kaufpreis liegen.',
  },
  streetBoss: {
    accountCount: 2,
    estimatedMonthlyValueUsd: { min: 8, max: 20 },
    priceRangeUsd: { min: 4.99, max: 5.99 },
  },
  caporegime: {
    accountCount: 3,
    estimatedMonthlyValueUsd: { min: 15, max: 40 },
  },
  godfather: {
    unlimited: true,
    estimatedMonthlyValueUsd: { min: 25, max: 80 },
    lifetimeSubjectivePaybackMonths: { min: 3, max: 9 },
  },
} as const;

export const BUSINESS_VALUE_GUIDANCE = {
  storeFeeAssumptionPercent: { min: 15, max: 30 },
  scenarios: {
    small: { payingUsers: 1500, yearlyMixPercent: 60, netAnnualUsd: { min: 40_000, max: 70_000 } },
    medium: { payingUsers: 4000, yearlyMixPercent: 65, netAnnualUsd: { min: 120_000, max: 200_000 } },
    strong: { payingUsers: 10_000, yearlyMixPercent: 70, netAnnualUsd: { min: 300_000, max: 500_000 }, openEnded: true },
  },
  ltvGuidanceUsd: {
    monthly: { min: 15, max: 40 },
    yearly: { min: 45, max: 120 },
    lifetime: { min: 90, max: 230 },
  },
} as const;

export const getTierPricing = (tier: Tier): TierPricing => TIER_PRICING[tier];
