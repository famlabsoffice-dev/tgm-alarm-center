import type { Tier } from './alarm';
import { trustedNativeTier } from '../billing/nativeEntitlementService';

export type BillingPeriod = 'weekly' | 'monthly' | 'sixMonth' | 'yearly' | 'lifetime';
export type CurrencyCode = 'EUR' | 'USD' | 'JPY';

export const FREE_TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
export const FREE_TRIAL_TIER: Tier = 'godfather';
export const FOUNDER_ACCESS_TIER: Tier = 'godfather';
export const FOUNDER_ACCOUNT_NAMES = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'] as const;
const FOUNDER_ACCOUNT_NAME_KEYS = new Set(FOUNDER_ACCOUNT_NAMES.map((name) => name.toLowerCase()));

export function isFounderAccountName(accountName: string): boolean {
  return FOUNDER_ACCOUNT_NAME_KEYS.has(accountName.trim().toLowerCase());
}

/** Legacy persisted tier is deliberately ignored for premium feature authorization. */
export function effectiveTierForAccount(tier: Tier, accountName: string): Tier {
  return isFounderAccountName(accountName) ? FOUNDER_ACCESS_TIER : trustedNativeTier(accountName, tier);
}

export interface FreeTrialState { startedAt: string | null; endsAt: string | null; }
export function isFreeTrialActive(trial: FreeTrialState, at = Date.now()): boolean { if (!trial.startedAt || !trial.endsAt) return false; const started = Date.parse(trial.startedAt); const ends = Date.parse(trial.endsAt); return Number.isFinite(started) && Number.isFinite(ends) && ends > started && at >= started && at < ends; }
export function canStartFreeTrial(trial: FreeTrialState): boolean { return trial.startedAt === null && trial.endsAt === null; }
export function startFreeTrial(at = Date.now()): FreeTrialState { return { startedAt: new Date(at).toISOString(), endsAt: new Date(at + FREE_TRIAL_DURATION_MS).toISOString() }; }

export interface TierPricing {
  tier: Tier; name: string;
  limits: { accounts: number; alarms: number; events: number; perAccount: { bubbleAlarms: number; eventAlarms: number; individualAlarms: number; rssAlarms: number } };
  eur: Record<BillingPeriod, number>; usdDirect: Record<BillingPeriod, number>; usdStore: Record<BillingPeriod, number>; jpyDirect: Record<BillingPeriod, number>; jpyStore: Record<BillingPeriod, number>; annualSavingPercent: number | null;
}
export const PRICE_REFERENCE = { date: '2026-08-31', eurUsd: 1.1596, eurJpy: 185.22, source: 'ECB euro reference exchange rates' } as const;
export const TIER_PRICING: Record<Tier, TierPricing> = {
  free: { tier: 'free', name: 'Free', limits: { accounts: 1, alarms: 2, events: 1, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 0, rssAlarms: 0 } }, eur: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, usdDirect: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, usdStore: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, jpyDirect: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, jpyStore: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, annualSavingPercent: null },
  streetBoss: { tier: 'streetBoss', name: 'Street Boss', limits: { accounts: 2, alarms: 4, events: 2, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 0, rssAlarms: 0 } }, eur: { weekly: 4.99, monthly: 14.99, sixMonth: 79.99, yearly: 129.99, lifetime: 199.99 }, usdDirect: { weekly: 5.79, monthly: 17.37, sixMonth: 92.77, yearly: 150.77, lifetime: 231.91 }, usdStore: { weekly: 5.99, monthly: 16.99, sixMonth: 89.99, yearly: 149.99, lifetime: 214.99 }, jpyDirect: { weekly: 924, monthly: 2777, sixMonth: 14815, yearly: 24072, lifetime: 37042 }, jpyStore: { weekly: 1000, monthly: 2800, sixMonth: 14800, yearly: 24000, lifetime: 37000 }, annualSavingPercent: 17 },
  caporegime: { tier: 'caporegime', name: 'Caporegime', limits: { accounts: 3, alarms: 9, events: 3, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 1, rssAlarms: 0 } }, eur: { weekly: 7.99, monthly: 24.99, sixMonth: 129.99, yearly: 199.99, lifetime: 299.99 }, usdDirect: { weekly: 9.26, monthly: 28.99, sixMonth: 150.72, yearly: 231.83, lifetime: 347.73 }, usdStore: { weekly: 9.99, monthly: 27.99, sixMonth: 149.99, yearly: 229.99, lifetime: 319.99 }, jpyDirect: { weekly: 1479, monthly: 4629, sixMonth: 24077, yearly: 37038, lifetime: 55557 }, jpyStore: { weekly: 1500, monthly: 4600, sixMonth: 24000, yearly: 37000, lifetime: 55000 }, annualSavingPercent: 23 },
  underboss: { tier: 'underboss', name: 'Underboss', limits: { accounts: 5, alarms: 15, events: 5, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 1, rssAlarms: 1 } }, eur: { weekly: 9.99, monthly: 34.99, sixMonth: 179.99, yearly: 299.99, lifetime: 449.99 }, usdDirect: { weekly: 11.58, monthly: 40.56, sixMonth: 208.77, yearly: 347.79, lifetime: 521.87 }, usdStore: { weekly: 11.99, monthly: 39.99, sixMonth: 199.99, yearly: 349.99, lifetime: 479.99 }, jpyDirect: { weekly: 1850, monthly: 6483, sixMonth: 33332, yearly: 55552, lifetime: 83358 }, jpyStore: { weekly: 1900, monthly: 6500, sixMonth: 33000, yearly: 56000, lifetime: 83000 }, annualSavingPercent: 17 },
  boss: { tier: 'boss', name: 'Boss', limits: { accounts: 10, alarms: 70, events: 20, perAccount: { bubbleAlarms: 1, eventAlarms: 2, individualAlarms: 2, rssAlarms: 2 } }, eur: { weekly: 14.99, monthly: 49.99, sixMonth: 249.99, yearly: 399.99, lifetime: 599.99 }, usdDirect: { weekly: 17.38, monthly: 57.94, sixMonth: 289.90, yearly: 463.84, lifetime: 695.76 }, usdStore: { weekly: 16.99, monthly: 54.99, sixMonth: 299.99, yearly: 499.99, lifetime: 699.99 }, jpyDirect: { weekly: 2777, monthly: 9259, sixMonth: 46296, yearly: 74088, lifetime: 111132 }, jpyStore: { weekly: 2800, monthly: 10000, sixMonth: 50000, yearly: 78000, lifetime: 115000 }, annualSavingPercent: 20 },
  godfather: { tier: 'godfather', name: 'Godfather', limits: { accounts: Number.POSITIVE_INFINITY, alarms: Number.POSITIVE_INFINITY, events: Number.POSITIVE_INFINITY, perAccount: { bubbleAlarms: Number.POSITIVE_INFINITY, eventAlarms: Number.POSITIVE_INFINITY, individualAlarms: Number.POSITIVE_INFINITY, rssAlarms: Number.POSITIVE_INFINITY } }, eur: { weekly: 19.99, monthly: 69.99, sixMonth: 399.99, yearly: 599.99, lifetime: 799.99 }, usdDirect: { weekly: 23.18, monthly: 81.10, sixMonth: 463.96, yearly: 695.68, lifetime: 927.64 }, usdStore: { weekly: 22.99, monthly: 79.99, sixMonth: 449.99, yearly: 699.99, lifetime: 899.99 }, jpyDirect: { weekly: 3702, monthly: 12956, sixMonth: 74086, yearly: 111061, lifetime: 148106 }, jpyStore: { weekly: 3700, monthly: 13000, sixMonth: 74000, yearly: 111000, lifetime: 148000 }, annualSavingPercent: 17 },
};
export const STORE_PRICING_NOTES = { eurAuthority: 'EUR target prices remain the authoritative commercial configuration.', usdStorePricing: 'USD store prices preserve the user-specified monthly and lifetime list prices and use logical rounded local prices for other durations.', jpyStorePricing: 'JPY store prices are rounded local list prices derived from EUR reference conversion, not live FX at checkout.', noHiddenCosts: 'Pricing presentation is explicit; plan selection and real store billing remain separate concerns.', referenceRateDate: PRICE_REFERENCE.date } as const;
export const VALUE_GUIDANCE = { freeUser: { purchasePriceUsd: 0, estimatedPreventedIncidentValueUsd: { min: 5, max: 50 }, description: 'Zeitwert eines verhinderten verpassten Bubble/GW-Events kann deutlich über dem Kaufpreis liegen.' }, streetBoss: { accountCount: 2, estimatedMonthlyValueUsd: { min: 8, max: 20 }, priceRangeUsd: { min: 4.99, max: 16.99 } }, caporegime: { accountCount: 3, estimatedMonthlyValueUsd: { min: 15, max: 40 }, priceRangeUsd: { min: 7.99, max: 27.99 } }, underboss: { accountCount: 5, estimatedMonthlyValueUsd: { min: 25, max: 60 }, priceRangeUsd: { min: 9.99, max: 39.99 } }, boss: { accountCount: 10, estimatedMonthlyValueUsd: { min: 40, max: 90 }, priceRangeUsd: { min: 16.99, max: 54.99 } }, godfather: { unlimited: true, estimatedMonthlyValueUsd: { min: 50, max: 120 }, lifetimeSubjectivePaybackMonths: { min: 3, max: 12 } } } as const;
export const BUSINESS_VALUE_GUIDANCE = { storeFeeAssumptionPercent: { min: 15, max: 30 }, scenarios: { small: { payingUsers: 1500, yearlyMixPercent: 60, netAnnualUsd: { min: 60000, max: 110000 } }, medium: { payingUsers: 4000, yearlyMixPercent: 65, netAnnualUsd: { min: 180000, max: 320000 } }, strong: { payingUsers: 10000, yearlyMixPercent: 70, netAnnualUsd: { min: 450000, max: 800000 }, openEnded: true } }, ltvGuidanceUsd: { monthly: { min: 20, max: 90 }, yearly: { min: 60, max: 220 }, lifetime: { min: 110, max: 420 } } } as const;
export const getTierPricing = (tier: Tier): TierPricing => TIER_PRICING[tier];
export function effectiveTier(tier: Tier, trial: FreeTrialState, at = Date.now()): Tier { return isFreeTrialActive(trial, at) ? FREE_TRIAL_TIER : tier; }
