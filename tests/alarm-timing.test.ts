import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TEMPLATES, buildAlarm, localDateTimeToUtc, validateAlarmTiming } from '../src/domain/alarm';

test('individual alarm timing accepts a start time before its own alarm time', () => {
  const startAtUtc = localDateTimeToUtc('2030-06-10', '18:15');
  const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
  assert.ok(startAtUtc);
  assert.ok(alarmAtUtc);
  assert.equal(validateAlarmTiming(startAtUtc, alarmAtUtc), true);
  const alarm = buildAlarm({ ...TEMPLATES.individual, startAtUtc }, 'account-1', '2030-06-10', '19:00');
  assert.equal(alarm.startAtUtc, startAtUtc);
  assert.equal(alarm.eventAtUtc, alarmAtUtc);
});

test('individual alarm timing rejects a start time after the alarm time', () => {
  const startAtUtc = localDateTimeToUtc('2030-06-10', '19:01');
  const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
  assert.ok(startAtUtc);
  assert.ok(alarmAtUtc);
  assert.equal(validateAlarmTiming(startAtUtc, alarmAtUtc), false);
  assert.throws(() => buildAlarm({ ...TEMPLATES.individual, startAtUtc }, 'account-1', '2030-06-10', '19:00'), /Startzeit darf nicht nach dem Alarmzeitpunkt liegen/);
});

test('legacy alarms remain valid without a start time', () => {
  const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
  assert.ok(alarmAtUtc);
  assert.equal(validateAlarmTiming(undefined, alarmAtUtc), true);
  const alarm = buildAlarm(TEMPLATES.individual, 'account-1', '2030-06-10', '19:00');
  assert.equal(alarm.startAtUtc, null);
});
