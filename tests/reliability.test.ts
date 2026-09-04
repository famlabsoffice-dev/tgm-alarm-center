import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEMPLATES,
  buildAlarm,
  localDateTimeToUtc,
  nextOccurrence,
  occurrenceEnd,
  occurrenceKey,
  upcomingMoments,
} from '../src/domain/alarm';

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
  const utc = withTimezone('Europe/Berlin', () => localDateTimeToUtc('2030-01-15', '14:30'));
  assert.ok(utc);
  const alarm = buildAlarm(TEMPLATES.custom, 'account-1', '2030-01-15', '14:30', new Date('2029-01-01T00:00:00.000Z'));
  assert.equal(alarm.eventAtUtc, utc);
  const before = new Date('2030-01-15T13:29:59.000Z');
  const after = new Date('2030-01-15T13:30:01.000Z');
  assert.equal(nextOccurrence(alarm, before)?.toISOString(), utc);
  assert.equal(nextOccurrence(alarm, after), null);
  withTimezone('America/New_York', () => {
    assert.equal(nextOccurrence(alarm, before)?.toISOString(), utc);
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
