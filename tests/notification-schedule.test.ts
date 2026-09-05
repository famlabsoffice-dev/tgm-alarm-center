import assert from 'node:assert/strict';
import test from 'node:test';
import { TEMPLATES, buildAlarm } from '../src/domain/alarm';
import { buildNotificationPlan, isWithinRollingNotificationWindow, NOTIFICATION_ROLLING_WINDOW_MS } from '../src/native/notificationSchedule';

const preferences = {
  sound: 'pulse' as const,
  warningSound: true,
  eventSound: true,
  vibration: true,
  criticalAlerts: true,
  preview: true,
};

test('notification plan keeps only future moments and preserves account ownership', () => {
  const now = new Date('2030-01-01T10:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.custom, 'account-7', '2030-01-01', '10:30', new Date('2029-01-01T00:00:00.000Z'));
  const plan = buildNotificationPlan([alarm], preferences, now);

  assert.equal(plan.length, 2);
  assert.ok(plan.every((entry) => Date.parse(entry.at) > now.getTime()));
  assert.ok(plan.every((entry) => entry.accountId === 'account-7'));
  assert.deepEqual(plan.map((entry) => entry.kind), ['warning', 'main']);
});

test('notification plan is deterministic and deduplicates identical alarm moments', () => {
  const now = new Date('2030-02-01T00:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-02-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const plan = buildNotificationPlan([alarm, alarm], preferences, now);
  const keys = plan.map((entry) => `${entry.alarmId}|${entry.eventTime}|${entry.kind}|${entry.warningMinutes ?? ''}`);
  assert.equal(plan.length, 2);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(plan, buildNotificationPlan([alarm], preferences, now));
});

test('notification plan excludes inactive alarms and preserves global multi-account scheduling', () => {
  const now = new Date('2030-03-01T00:00:00.000Z');
  const accountOne = buildAlarm(TEMPLATES.custom, 'account-1', '2030-03-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const accountTwo = buildAlarm(TEMPLATES.custom, 'account-2', '2030-03-01', '04:00', new Date('2029-01-01T00:00:00.000Z'));
  const inactive = buildAlarm(TEMPLATES.custom, 'account-3', '2030-03-01', '05:00', new Date('2029-01-01T00:00:00.000Z'));
  inactive.active = false;

  const plan = buildNotificationPlan([accountTwo, inactive, accountOne], preferences, now);
  assert.equal(plan.length, 4);
  assert.deepEqual(new Set(plan.map((entry) => entry.accountId)), new Set(['account-1', 'account-2']));
  assert.equal(plan.some((entry) => entry.accountId === 'account-3'), false);
  assert.deepEqual(plan.map((entry) => entry.at), [...plan].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).map((entry) => entry.at));
});

test('warning and event sound preferences are applied per notification moment', () => {
  const now = new Date('2030-04-01T00:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-04-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const plan = buildNotificationPlan([alarm], { ...preferences, warningSound: false, eventSound: true }, now);
  assert.equal(plan.find((entry) => entry.kind === 'warning')?.soundEnabled, false);
  assert.equal(plan.find((entry) => entry.kind === 'main')?.soundEnabled, true);
});

test('rolling-window boundaries are strict at now and inclusive at the horizon', () => {
  const now = new Date('2030-05-01T00:00:00.000Z');
  const atNow = new Date(now.getTime());
  const atHorizon = new Date(now.getTime() + NOTIFICATION_ROLLING_WINDOW_MS);
  const afterHorizon = new Date(atHorizon.getTime() + 1);

  assert.equal(isWithinRollingNotificationWindow(atNow, now), false);
  assert.equal(isWithinRollingNotificationWindow(atHorizon, now), true);
  assert.equal(isWithinRollingNotificationWindow(afterHorizon, now), false);
});

test('GW notification plan contains warning, main, end-warning and end moments', () => {
  const now = new Date('2030-06-01T00:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.gwBubble, 'account-gw', '2030-06-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const plan = buildNotificationPlan([alarm], preferences, now);

  assert.deepEqual(plan.map((entry) => entry.kind), ['warning', 'warning', 'warning', 'main', 'end-warning', 'end']);
  assert.deepEqual(plan.filter((entry) => entry.kind === 'warning').map((entry) => entry.warningMinutes), [60, 30, 15]);
  assert.equal(plan[4]?.endAt, '2030-06-02T03:00:00.000Z');
  assert.equal(plan[5]?.endAt, '2030-06-02T03:00:00.000Z');
});

test('completed one-shot occurrences do not get resurrected by notification planning', () => {
  const now = new Date('2030-07-02T00:00:00.000Z');
  const eventAt = new Date('2030-07-01T03:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.custom, 'account-completed', '2030-07-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  alarm.eventAtUtc = eventAt.toISOString();
  alarm.completedOccurrences[`${alarm.id}:${eventAt.toISOString()}`] = true;

  assert.deepEqual(buildNotificationPlan([alarm], preferences, now), []);
});
