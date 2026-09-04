import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEMPLATES,
  alarmsForAccount,
  buildAlarm,
  nextOccurrence,
  occurrenceEnd,
  occurrenceKey,
  upcomingMoments,
} from '../src/domain/alarm';
import { findOwnedAlarm, ownsAlarm, updateOwnedAlarm } from '../src/domain/accountIsolation';

const withTimezone = <T>(timezone: string, run: () => T): T => {
  const previous = process.env.TZ;
  process.env.TZ = timezone;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

test('once alarms remain anchored to the persisted absolute UTC instant after a timezone change', () => {
  withTimezone('Europe/Berlin', () => {
    const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-01-15', '14:30', new Date('2029-01-01T00:00:00.000Z'));
    const persistedUtc = alarm.eventAtUtc;
    assert.ok(Number.isFinite(Date.parse(persistedUtc)));
    const before = new Date(Date.parse(persistedUtc) - 1000);
    const after = new Date(Date.parse(persistedUtc) + 1000);
    assert.equal(nextOccurrence(alarm, before)?.toISOString(), persistedUtc);
    assert.equal(nextOccurrence(alarm, after), null);
    withTimezone('America/New_York', () => {
      assert.equal(nextOccurrence(alarm, before)?.toISOString(), persistedUtc);
    });
  });
});

test('daily recurrence keeps the configured local clock across the European DST transition', () => {
  withTimezone('Europe/Berlin', () => {
    const alarm = buildAlarm(
      { ...TEMPLATES.custom, repeat: 'daily' },
      'account-1',
      '2030-03-30',
      '09:15',
      new Date('2030-03-29T12:00:00.000Z'),
    );
    const now = new Date('2030-03-31T06:00:00.000Z');
    const next = nextOccurrence(alarm, now);
    assert.ok(next);
    assert.equal(next.getFullYear(), 2030);
    assert.equal(next.getMonth(), 2);
    assert.equal(next.getDate(), 31);
    assert.equal(next.getHours(), 9);
    assert.equal(next.getMinutes(), 15);
  });
});

test('GW cycle produces one coherent occurrence with warning, end-warning and end moments', () => {
  const base = new Date('2030-01-01T12:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.gwBubble, 'account-1', '2030-01-01', '13:00', base);
  const now = new Date('2030-01-02T00:00:00.000Z');
  const next = nextOccurrence(alarm, now);
  assert.ok(next);
  const end = occurrenceEnd(alarm, next);
  assert.ok(end);
  assert.equal(end.getTime() - next.getTime(), 24 * 60 * 60 * 1000);
  const moments = upcomingMoments(alarm, now);
  assert.deepEqual(moments.filter((m) => m.kind === 'warning').map((m) => m.warningMinutes), [60, 30, 15]);
  assert.equal(moments.filter((m) => m.kind === 'end-warning').length, 1);
  assert.equal(moments.filter((m) => m.kind === 'end').length, 1);
});

test('completed occurrence suppresses all notification moments and reactivation remains schedulable', () => {
  const event = new Date('2030-04-01T12:00:00.000Z');
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-04-01', '14:00', new Date('2029-01-01T00:00:00.000Z'));
  const occurrence = new Date(alarm.eventAtUtc);
  alarm.completedOccurrences[occurrenceKey(alarm.id, occurrence)] = true;
  assert.equal(nextOccurrence(alarm, new Date('2030-04-01T13:00:00.000Z')), null);
  alarm.active = false;
  assert.equal(nextOccurrence(alarm, event), null);
  alarm.active = true;
  alarm.repeat = 'daily';
  const next = nextOccurrence(alarm, new Date('2030-04-01T15:00:00.000Z'));
  assert.ok(next);
  assert.equal(next.getDate(), 2);
});

test('rapid occurrence completion uses a stable occurrence key and cannot complete a different alarm', () => {
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-05-01', '10:00', new Date('2029-01-01T00:00:00.000Z'));
  const event = new Date(alarm.eventAtUtc);
  const key = occurrenceKey(alarm.id, event);
  alarm.completedOccurrences[key] = true;
  assert.equal(alarm.completedOccurrences[occurrenceKey(alarm.id, event)], true);
  assert.equal(alarm.completedOccurrences[occurrenceKey(`${alarm.id}-other`, event)], undefined);
});

test('notification schedule remains account-independent when the selected account changes', () => {
  const now = new Date('2030-06-01T00:00:00.000Z');
  const accountOneAlarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-06-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const accountTwoAlarm = buildAlarm(TEMPLATES.custom, 'account-2', '2030-06-01', '04:00', new Date('2029-01-01T00:00:00.000Z'));
  const alarms = [accountOneAlarm, accountTwoAlarm];
  const beforeSwitch = alarms.filter((alarm) => alarm.active).flatMap((alarm) => upcomingMoments(alarm, now));
  const afterSwitch = alarms.filter((alarm) => alarm.active).flatMap((alarm) => upcomingMoments(alarm, now));
  assert.deepEqual(afterSwitch.map((moment) => `${moment.alarmId}:${moment.kind}:${moment.at.toISOString()}`), beforeSwitch.map((moment) => `${moment.alarmId}:${moment.kind}:${moment.at.toISOString()}`));
  assert.deepEqual(new Set(afterSwitch.map((moment) => moment.alarmId)), new Set([accountOneAlarm.id, accountTwoAlarm.id]));
});

test('visible alarm projection is strictly isolated to the active account', () => {
  const now = new Date('2029-01-01T00:00:00.000Z');
  const accountOneAlarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-06-01', '03:00', now);
  const accountTwoAlarm = buildAlarm(TEMPLATES.custom, 'account-2', '2030-06-01', '04:00', now);
  const alarms = [accountOneAlarm, accountTwoAlarm];

  assert.deepEqual(alarmsForAccount(alarms, 'account-1').map((alarm) => alarm.id), [accountOneAlarm.id]);
  assert.deepEqual(alarmsForAccount(alarms, 'account-2').map((alarm) => alarm.id), [accountTwoAlarm.id]);
  assert.deepEqual(alarmsForAccount(alarms, null), []);
  assert.equal(alarmsForAccount(alarms, 'account-1').some((alarm) => alarm.accountId !== 'account-1'), false);
});

test('changing the selected account does not change the global notification moments', () => {
  const now = new Date('2030-06-01T00:00:00.000Z');
  const accountOneAlarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-06-01', '03:00', new Date('2029-01-01T00:00:00.000Z'));
  const accountTwoAlarm = buildAlarm(TEMPLATES.custom, 'account-2', '2030-06-01', '04:00', new Date('2029-01-01T00:00:00.000Z'));
  const alarms = [accountOneAlarm, accountTwoAlarm];
  const globalSchedule = alarms.flatMap((alarm) => upcomingMoments(alarm, now));
  const before = globalSchedule.map((moment) => `${moment.alarmId}:${moment.kind}:${moment.at.toISOString()}`).sort();
  const after = globalSchedule.map((moment) => `${moment.alarmId}:${moment.kind}:${moment.at.toISOString()}`).sort();
  assert.deepEqual(after, before);
  assert.equal(after.length, 4);
  assert.equal(before.filter((value) => value.startsWith(`${accountOneAlarm.id}:`)).length, 2);
  assert.equal(before.filter((value) => value.startsWith(`${accountTwoAlarm.id}:`)).length, 2);
});

test('ownership guard rejects missing or foreign ownership without invoking the mutator', () => {
  const now = new Date('2029-01-01T00:00:00.000Z');
  const accountOneAlarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-07-01', '03:00', now);
  const accountTwoAlarm = buildAlarm(TEMPLATES.custom, 'account-2', '2030-07-01', '04:00', now);
  const alarms = [accountOneAlarm, accountTwoAlarm];

  assert.equal(ownsAlarm(accountOneAlarm, 'account-1'), true);
  assert.equal(ownsAlarm(accountOneAlarm, 'account-2'), false);
  assert.equal(ownsAlarm(accountOneAlarm, null), false);

  assert.equal(findOwnedAlarm(alarms, accountOneAlarm.id, 'account-2'), null);
  assert.equal(findOwnedAlarm(alarms, accountOneAlarm.id, null), null);
  assert.equal(findOwnedAlarm(alarms, accountOneAlarm.id, 'account-1')?.id, accountOneAlarm.id);

  let mutatorCalled = false;
  const unchanged = updateOwnedAlarm(alarms, accountOneAlarm.id, 'account-2', () => {
    mutatorCalled = true;
    return { ...accountOneAlarm, title: 'ILLEGAL' };
  });
  assert.equal(mutatorCalled, false);
  assert.equal(unchanged[0], accountOneAlarm);
  assert.equal(unchanged[1], accountTwoAlarm);

  const updated = updateOwnedAlarm(alarms, accountOneAlarm.id, 'account-1', (alarm) => ({ ...alarm, title: 'Updated' }));
  assert.equal(updated[0]?.title, 'Updated');
  assert.equal(updated[1], accountTwoAlarm);
});
