import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEMPLATES,
  TIER_LIMITS,
  alarmTypeLabel,
  repeatLabel,
  buildAlarm,
  localDateTimeToUtc,
  localInputFromUtc,
  nextOccurrence,
  occurrenceEnd,
  occurrenceKey,
  upcomingMoments,
  validateDateTime,
} from '../src/domain/alarm';
import { FREE_TRIAL_DURATION_MS, TIER_PRICING, canStartFreeTrial, effectiveTier, isFreeTrialActive, startFreeTrial } from '../src/domain/pricing';
import { highestTier, productForId, STORE_LIFETIME_IDS, STORE_PRODUCT_IDS, STORE_SUBSCRIPTION_IDS } from '../src/billing/catalog';

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

test('uses the production templates for all core alarm types', () => {
  assert.deepEqual(TEMPLATES.bubble.warnings, [60, 15]);
  assert.equal(TEMPLATES.bubble.sound, 'pulse');
  assert.equal(TEMPLATES.gwBubble.repeat, 'gw5d');
  assert.deepEqual(TEMPLATES.gwBubble.warnings, [60, 30, 15]);
  assert.equal(TEMPLATES.gwBubble.sound, 'siren');
  assert.deepEqual(TEMPLATES.custom.warnings, [15]);
  assert.equal(TEMPLATES.custom.sound, 'chime');
});

test('preserves the first future GW occurrence instead of skipping a cycle', () => {
  const base = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const alarm = buildAlarm(TEMPLATES.gwBubble, 'account-1', localDate(base), localTime(base), new Date());
  const next = nextOccurrence(alarm, new Date(base.getTime() - 1));
  assert.ok(next);
  assert.equal(next.toISOString(), alarm.eventAtUtc);
});

test('advances a completed future GW base by exactly one cycle', () => {
  const base = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const alarm = buildAlarm(TEMPLATES.gwBubble, 'account-1', localDate(base), localTime(base), new Date());
  alarm.completedOccurrences[occurrenceKey(alarm.id, base)] = true;
  const next = nextOccurrence(alarm, new Date(base.getTime() - 1));
  assert.ok(next);
  assert.equal(next.getTime(), base.getTime() + 5 * 24 * 60 * 60 * 1000);
});

test('calculates the five-day GW cycle and both end moments', () => {
  const base = new Date();
  base.setDate(base.getDate() - 6);
  const alarm = buildAlarm(TEMPLATES.gwBubble, 'account-1', localDate(base), localTime(base), base);
  assert.equal(alarm.repeat, 'gw5d');
  const next = nextOccurrence(alarm, new Date());
  assert.ok(next);
  assert.equal((next.getTime() - new Date(alarm.eventAtUtc).getTime()) % (5 * 24 * 60 * 60 * 1000), 0);
  const end = occurrenceEnd(alarm, next);
  assert.ok(end);
  assert.equal(end.getTime() - next.getTime(), 24 * 60 * 60 * 1000);
  const moments = upcomingMoments(alarm, new Date());
  assert.deepEqual(moments.filter((moment) => moment.kind === 'warning').map((moment) => moment.warningMinutes), [60, 30, 15]);
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

test('keeps the six-tier commercial ladder and all currency periods synchronized', () => {
  assert.deepEqual(Object.keys(TIER_LIMITS), ['free', 'streetBoss', 'caporegime', 'underboss', 'boss', 'godfather']);
  assert.equal(TIER_LIMITS.underboss.accounts, 5);
  assert.equal(TIER_LIMITS.underboss.alarms, 15);
  assert.equal(TIER_LIMITS.underboss.events, 5);
  assert.equal(TIER_LIMITS.caporegime.perAccount.individualAlarms, 1);
  assert.equal(TIER_LIMITS.caporegime.perAccount.rssAlarms, 0);
  assert.equal(TIER_LIMITS.underboss.perAccount.individualAlarms, 1);
  assert.equal(TIER_LIMITS.underboss.perAccount.rssAlarms, 1);
  assert.equal(TIER_LIMITS.boss.accounts, 10);
  assert.equal(TIER_LIMITS.boss.perAccount.eventAlarms, 2);
  assert.equal(TIER_LIMITS.boss.perAccount.individualAlarms, 2);
  assert.equal(TIER_LIMITS.boss.perAccount.rssAlarms, 2);
  assert.equal(TIER_PRICING.streetBoss.eur.monthly, 14.99);
  assert.equal(TIER_PRICING.streetBoss.eur.lifetime, 199.99);
  assert.equal(TIER_PRICING.caporegime.eur.monthly, 24.99);
  assert.equal(TIER_PRICING.underboss.eur.monthly, 34.99);
  assert.equal(TIER_PRICING.underboss.eur.lifetime, 449.99);
  assert.equal(TIER_PRICING.boss.eur.monthly, 49.99);
  assert.equal(TIER_PRICING.boss.eur.lifetime, 599.99);
  assert.equal(TIER_PRICING.boss.usdStore.monthly, 54.99);
  assert.equal(TIER_PRICING.boss.usdStore.lifetime, 699.99);
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
  assert.equal(TEMPLATES.individual.type, 'individual');
  assert.equal(TEMPLATES.rss.type, 'rss');
  assert.equal(TEMPLATES.bubble.sound, 'pulse');
  assert.equal(TEMPLATES.gwBubble.sound, 'siren');
  assert.equal(TEMPLATES.custom.sound, 'chime');
  assert.equal(TEMPLATES.individual.sound, 'pulse');
  assert.equal(TEMPLATES.rss.sound, 'chime');
  assert.equal(alarmTypeLabel('bubble'), 'Bubble Alarm');
  assert.equal(alarmTypeLabel('gwBubble'), 'Massacre Alarm');
  assert.equal(alarmTypeLabel('custom'), 'Event Alarm');
  assert.equal(alarmTypeLabel('individual'), 'Individual Timer');
  assert.equal(alarmTypeLabel('rss'), 'RSS Timer');
  assert.equal(repeatLabel('gw5d'), 'Massacre Alarm · alle 5 Tage');
  for (const tier of Object.values(TIER_PRICING)) {
    assert.deepEqual(Object.keys(tier.eur), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
    assert.deepEqual(Object.keys(tier.usdStore), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
    assert.deepEqual(Object.keys(tier.jpyStore), ['weekly', 'monthly', 'sixMonth', 'yearly', 'lifetime']);
  }
});

test('maps every paid store product to a valid tier and period', () => {
  assert.equal(STORE_PRODUCT_IDS.length, 25);
  assert.equal(STORE_SUBSCRIPTION_IDS.length, 20);
  assert.equal(STORE_LIFETIME_IDS.length, 5);
  assert.equal(productForId('com.tgm.alarmcenter.underboss_yearly')?.tier, 'underboss');
  assert.equal(productForId('com.tgm.alarmcenter.godfather_lifetime')?.kind, 'lifetime');
  assert.equal(highestTier(['com.tgm.alarmcenter.street_boss_monthly', 'com.tgm.alarmcenter.boss_yearly']), 'boss');
  assert.equal(highestTier(['unrecognized.product']), 'free');
});

test('does not resurface a completed one-off occurrence', () => {
  const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', localDate(future), localTime(future));
  alarm.completedOccurrences[occurrenceKey(alarm.id, new Date(alarm.eventAtUtc))] = true;
  assert.equal(nextOccurrence(alarm), null);
});
