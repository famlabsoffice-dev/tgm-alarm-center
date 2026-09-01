import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEMPLATES,
  TIER_LIMITS,
  buildAlarm,
  localDateTimeToUtc,
  localInputFromUtc,
  nextOccurrence,
  occurrenceEnd,
  occurrenceKey,
  upcomingMoments,
  validateDateTime,
} from '../src/domain/alarm';
import { FOUNDER_ACCESS_TIER, FOUNDER_ACCOUNT_NAMES, FREE_TRIAL_DURATION_MS, TIER_PRICING, canStartFreeTrial, effectiveTier, effectiveTierForAccount, isFounderAccountName, isFreeTrialActive, startFreeTrial } from '../src/domain/pricing';

const localDate = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localTime = (date: Date): string => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

test('rejects impossible calendar dates and invalid times', () => {
  assert.equal(validateDateTime('2026-02-30', '10:00'), false);
  assert.equal(validateDateTime('2026-04-31', '10:00'), false);
  assert.equal(validateDateTime('2026-09-01', '24:00'), false);
  assert.equal(validateDateTime('2026-09-01', '09:60'), false);
  assert.equal(validateDateTime('2026-09-01', '09:30'), true);
});

test('keeps local input stable through the internal UTC representation', () => {
  const utc = localDateTimeToUtc('2030-01-15', '14:30');
  assert.ok(utc);
  assert.deepEqual(localInputFromUtc(utc), { date: '2030-01-15', time: '14:30' });
});

test('calculates daily recurrence from the local clock after a restart', () => {
  const past = new Date();
  past.setDate(past.getDate() - 2);
  const alarm = buildAlarm({ ...TEMPLATES.custom, repeat: 'daily' }, 'account-1', localDate(past), localTime(past), past);
  const next = nextOccurrence(alarm, new Date());
  assert.ok(next);
  assert.equal(next.getHours(), past.getHours());
  assert.equal(next.getMinutes(), past.getMinutes());
  assert.ok(next.getTime() > Date.now());
});

test('calculates the five-day GW cycle and both end moments', () => {
  const base = new Date();
  base.setDate(base.getDate() - 6);
  const alarm = buildAlarm({ ...TEMPLATES.gwBubble, repeat: 'gw5d' }, 'account-1', localDate(base), localTime(base), base);
  const next = nextOccurrence(alarm, new Date());
  assert.ok(next);
  assert.equal((next.getTime() - new Date(alarm.eventAtUtc).getTime()) % (5 * 24 * 60 * 60 * 1000), 0);
  const end = occurrenceEnd(alarm, next);
  assert.ok(end);
  assert.equal(end.getTime() - next.getTime(), 24 * 60 * 60 * 1000);
  const moments = upcomingMoments(alarm, new Date());
  assert.ok(moments.some((moment) => moment.kind === 'end-warning'));
  assert.ok(moments.some((moment) => moment.kind === 'end'));
});

test('supports one-time three-day free trial activation and expiry', () => {
  const started = Date.parse('2030-01-01T12:00:00.000Z');
  const trial = startFreeTrial(started);
  assert.equal(FREE_TRIAL_DURATION_MS, 3 * 24 * 60 * 60 * 1000);
  assert.equal(canStartFreeTrial({ startedAt: null, endsAt: null }), true);
  assert.equal(canStartFreeTrial(trial), false);
  assert.equal(isFreeTrialActive(trial, started), true);
  assert.equal(isFreeTrialActive(trial, started + FREE_TRIAL_DURATION_MS - 1), true);
  assert.equal(isFreeTrialActive(trial, started + FREE_TRIAL_DURATION_MS), false);
  assert.equal(effectiveTier('free', trial, started + 1), 'godfather');
  assert.equal(effectiveTier('free', trial, started + FREE_TRIAL_DURATION_MS), 'free');
});

test('recognizes every founder account and grants the permanent Godfather tier', () => {
  assert.deepEqual(FOUNDER_ACCOUNT_NAMES, ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred']);
  for (const name of FOUNDER_ACCOUNT_NAMES) {
    assert.equal(isFounderAccountName(name), true);
    assert.equal(effectiveTierForAccount('free', name), FOUNDER_ACCESS_TIER);
  }
  assert.equal(isFounderAccountName(' tgmack '), true);
  assert.equal(effectiveTierForAccount('underboss', 'TGMj9'), FOUNDER_ACCESS_TIER);
  assert.equal(isFounderAccountName('TGMack2'), false);
  assert.equal(effectiveTierForAccount('free', 'TGMack2'), 'free');
});

test('keeps the five-tier commercial ladder and all currency periods synchronized', () => {
  assert.deepEqual(Object.keys(TIER_LIMITS), ['free', 'streetBoss', 'caporegime', 'underboss', 'godfather']);
  assert.equal(TIER_LIMITS.underboss.accounts, 5);
  assert.equal(TIER_LIMITS.underboss.alarms, 10);
  assert.equal(TIER_LIMITS.underboss.events, 5);
  assert.equal(TIER_PRICING.streetBoss.eur.monthly, 14.99);
  assert.equal(TIER_PRICING.streetBoss.eur.lifetime, 199.99);
  assert.equal(TIER_PRICING.caporegime.eur.monthly, 24.99);
  assert.equal(TIER_PRICING.underboss.eur.monthly, 34.99);
  assert.equal(TIER_PRICING.underboss.eur.lifetime, 449.99);
  assert.equal(TIER_PRICING.godfather.eur.monthly, 69.99);
  assert.equal(TIER_PRICING.godfather.eur.lifetime, 799.99);
  assert.equal(TIER_PRICING.streetBoss.usdStore.monthly, 16.99);
  assert.equal(TIER_PRICING.streetBoss.usdStore.lifetime, 214.99);
  assert.equal(TIER_PRICING.caporegime.usdStore.monthly, 27.99);
  assert.equal(TIER_PRICING.caporegime.usdStore.lifetime, 319.99);
  assert.equal(TIER_PRICING.underboss.usdStore.monthly, 39.99);
  assert.equal(TIER_PRICING.underboss.usdStore.lifetime, 479.99);
  assert.equal(TIER_PRICING.godfather.usdStore.monthly, 79.99);
  assert.equal(TIER_PRICING.godfather.usdStore.lifetime, 899.99);
  for (const tier of Object.values(TIER_PRICING)) {
    assert.deepEqual(Object.keys(tier.eur), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
    assert.deepEqual(Object.keys(tier.usdStore), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
    assert.deepEqual(Object.keys(tier.jpyStore), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
  }
});

test('does not resurface a completed one-off occurrence', () => {
  const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', localDate(future), localTime(future));
  alarm.completedOccurrences[occurrenceKey(alarm.id, new Date(alarm.eventAtUtc))] = true;
  assert.equal(nextOccurrence(alarm), null);
});
