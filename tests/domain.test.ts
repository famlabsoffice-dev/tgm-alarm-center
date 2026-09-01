import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEMPLATES,
  buildAlarm,
  localDateTimeToUtc,
  localInputFromUtc,
  nextOccurrence,
  occurrenceEnd,
  occurrenceKey,
  upcomingMoments,
  validateDateTime,
} from '../src/domain/alarm';
import { FREE_TRIAL_DURATION_MS, canStartFreeTrial, effectiveTier, isFreeTrialActive, startFreeTrial } from '../src/domain/pricing';

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

test('does not resurface a completed one-off occurrence', () => {
  const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', localDate(future), localTime(future));
  alarm.completedOccurrences[occurrenceKey(alarm.id, new Date(alarm.eventAtUtc))] = true;
  assert.equal(nextOccurrence(alarm), null);
});
