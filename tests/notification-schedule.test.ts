import assert from 'node:assert/strict';
import test from 'node:test';
import { TEMPLATES, buildAlarm } from '../src/domain/alarm';
import { buildNotificationPlan } from '../src/native/notificationSchedule';

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
