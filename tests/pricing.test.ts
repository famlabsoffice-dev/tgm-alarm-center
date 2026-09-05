import assert from 'node:assert/strict';
import test from 'node:test';
import { TIER_PRICING } from '../src/domain/pricing';

test('annual saving percentages match monthly-to-yearly pricing', () => {
  for (const tier of ['streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'] as const) {
    const pricing = TIER_PRICING[tier];
    const monthlyAnnual = pricing.eur.monthly * 12;
    const saving = Math.round((1 - pricing.eur.yearly / monthlyAnnual) * 100);
    assert.equal(pricing.annualSavingPercent, saving, `${tier} annual saving mismatch`);
  }
});
