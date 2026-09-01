import type { Tier } from './alarm';

export type BillingPeriod = 'weekly' | 'monthly' | 'sixMonth' | 'yearly' | 'lifetime';

export const FREE_TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
export const FREE_TRIAL_TIER: Tier = 'godfather';

export interface FreeTrialState {
  startedAt: string | null;
  endsAt: string | null;
}

export function isFreeTrialActive(trial: FreeTrialState, at = Date.now()): boolean {
  if (!trial.startedAt || !trial.endsAt) return false;
  const started = Date.parse(trial.startedAt);
  const ends = Date.parse(trial.endsAt);
  return Number.isFinite(started) && Number.isFinite(ends) && ends > started && at >= started && at < ends;
}

export function canStartFreeTrial(trial: FreeTrialState): boolean {
  return trial.startedAt === null && trial.endsAt === null;
}

export function startFreeTrial(at = Date.now()): FreeTrialState {
  return { startedAt: new Date(at).toISOString(), endsAt: new Date(at + FREE_TRIAL_DURATION_MS).toISOString() };
}

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
    eur: { weekly: 4.99, monthly: 14.99, sixMonth: 79.99, yearly: 129.99, lifetime: 199.99 },
    usdDirect: { weekly: 5.79, monthly: 17.39, sixMonth: 92.79, yearly: 150.79, lifetime: 231.99 },
    usdStore: { weekly: 4.99, monthly: 16.99, sixMonth: 84.99, yearly: 139.99, lifetime: 214.99 },
    annualSavingPercent: 25,
  },
  caporegime: {
    tier: 'caporegime',
    name: 'Caporegime',
    limits: { accounts: 3, alarms: 6, events: 3, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
    eur: { weekly: 7.99, monthly: 24.99, sixMonth: 129.99, yearly: 199.99, lifetime: 299.99 },
    usdDirect: { weekly: 9.27, monthly: 28.99, sixMonth: 150.79, yearly: 231.99, lifetime: 347.99 },
    usdStore: { weekly: 7.99, monthly: 27.99, sixMonth: 139.99, yearly: 214.99, lifetime: 319.99 },
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
    eur: { weekly: 12.99, monthly: 39.99, sixMonth: 214.99, yearly: 319.99, lifetime: 499.99 },
    usdDirect: { weekly: 15.07, monthly: 46.39, sixMonth: 231.99, yearly: 347.99, lifetime: 579.99 },
    usdStore: { weekly: 12.99, monthly: 44.99, sixMonth: 229.99, yearly: 349.99, lifetime: 529.99 },
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

export function effectiveTier(tier: Tier, trial: FreeTrialState, at = Date.now()): Tier {
  return isFreeTrialActive(trial, at) ? FREE_TRIAL_TIER : tier;
}
