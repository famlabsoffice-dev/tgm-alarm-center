import type { Tier } from './alarm';

export type BillingPeriod = 'weekly' | 'monthly' | 'sixMonth' | 'yearly' | 'lifetime';

export interface TierPricing {
  tier: Tier;
  name: string;
  limits: {
    accounts: number;
    alarms: number;
    events: number;
    perAccount: { bubbleAlarms: number; eventAlarms: number };
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
    limits: { accounts: 1, alarms: 2, events: 1, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
    eur: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 },
    usdDirect: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 },
    usdStore: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 },
    annualSavingPercent: null,
  },
  streetBoss: {
    tier: 'streetBoss',
    name: 'Street Boss',
    limits: { accounts: 2, alarms: 4, events: 2, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
    eur: { weekly: 1.99, monthly: 5.99, sixMonth: 32.99, yearly: 54.99, lifetime: 99.99 },
    usdDirect: { weekly: 2.31, monthly: 6.95, sixMonth: 38.27, yearly: 63.79, lifetime: 115.99 },
    usdStore: { weekly: 1.99, monthly: 6.99, sixMonth: 34.99, yearly: 59.99, lifetime: 104.99 },
    annualSavingPercent: 25,
  },
  caporegime: {
    tier: 'caporegime',
    name: 'Caporegime',
    limits: { accounts: 3, alarms: 6, events: 3, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
    eur: { weekly: 2.99, monthly: 8.99, sixMonth: 49.99, yearly: 79.99, lifetime: 149.99 },
    usdDirect: { weekly: 3.47, monthly: 10.43, sixMonth: 57.99, yearly: 92.79, lifetime: 173.99 },
    usdStore: { weekly: 2.99, monthly: 9.99, sixMonth: 54.99, yearly: 89.99, lifetime: 159.99 },
    annualSavingPercent: 33,
  },
  godfather: {
    tier: 'godfather',
    name: 'Godfather',
    limits: {
      accounts: Number.POSITIVE_INFINITY,
      alarms: Number.POSITIVE_INFINITY,
      events: Number.POSITIVE_INFINITY,
      perAccount: { bubbleAlarms: Number.POSITIVE_INFINITY, eventAlarms: Number.POSITIVE_INFINITY },
    },
    eur: { weekly: 4.99, monthly: 14.99, sixMonth: 89.99, yearly: 119.99, lifetime: 229.99 },
    usdDirect: { weekly: 5.79, monthly: 17.39, sixMonth: 104.39, yearly: 139.19, lifetime: 266.79 },
    usdStore: { weekly: 4.99, monthly: 16.99, sixMonth: 94.99, yearly: 129.99, lifetime: 239.99 },
    annualSavingPercent: 33,
  },
};

export const STORE_PRICING_NOTES = {
  usdStorePricing:
    'Recommended conversion-optimized USD list prices for App Store / Google Play.',
  streetBossMonthlyAlternativeUsd: 6.99,
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
