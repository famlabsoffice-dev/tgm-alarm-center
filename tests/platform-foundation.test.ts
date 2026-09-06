import assert from 'node:assert/strict';
import test from 'node:test';
import { alarmFromEvent } from '../src/platform/eventToAlarm';
import { createCanonicalAdapter, EventSourceRegistry } from '../src/platform/eventSource';
import { deduplicateEvents, normalizeExternalEvent, validateExternalEvent } from '../src/platform/alarmableEvent';

test('normalizes a canonical external event deterministically', () => {
  const event = normalizeExternalEvent({
    source: 'partner', sourceId: 'tgmhub', sourceEventId: 'lucky-sprint-2026-09-06', title: 'Lucky Sprint',
    startAtUtc: '2026-09-06T18:00:00.000Z', endAtUtc: '2026-09-07T18:00:00.000Z', timezone: 'Europe/Berlin', priority: 'high', alarmType: 'custom', warningMinutes: [60, 15, 15], sound: 'chime',
  }, new Date('2026-09-06T05:00:00.000Z'));
  assert.equal(event.id, 'partner:tgmhub:lucky-sprint-2026-09-06');
  assert.deepEqual(event.warningMinutes, [60, 15]);
  assert.equal(event.endAtUtc, '2026-09-07T18:00:00.000Z');
});

test('rejects invalid UTC and reversed end timestamps', () => {
  const errors = validateExternalEvent({ source: 'partner', sourceId: 'tgmhub', sourceEventId: 'bad', title: 'Bad', startAtUtc: '2026-09-06T18:00:00.000Z', endAtUtc: '2026-09-06T17:00:00.000Z' });
  assert.deepEqual(errors, ['endAtUtc must be after startAtUtc']);
});

test('registry prevents duplicate adapters and preserves source identity', () => {
  const registry = new EventSourceRegistry();
  registry.register(createCanonicalAdapter('partner', 'tgmhub'));
  assert.throws(() => registry.register(createCanonicalAdapter('partner', 'tgmhub')), /already registered/);
  assert.throws(() => registry.normalize('tgmhub', { source: 'partner', sourceId: 'other', sourceEventId: '1', title: 'Mismatch', startAtUtc: '2026-09-06T18:00:00.000Z' }), /identity mismatch/);
});

test('converts a normalized event into an existing Alarm without changing alarm-domain semantics', () => {
  const event = normalizeExternalEvent({ source: 'partner', sourceId: 'tgmhub', sourceEventId: 'gw-1', title: 'GW Event', startAtUtc: '2026-09-06T18:00:00.000Z', priority: 'critical', alarmType: 'gwBubble', warningMinutes: [60, 30, 15], sound: 'siren', repeat: 'once' }, new Date('2026-09-06T05:00:00.000Z'));
  const alarm = alarmFromEvent(event, { accountId: 'account-1', now: new Date('2026-09-06T05:00:00.000Z') });
  assert.equal(alarm.id, 'event:partner:tgmhub:gw-1');
  assert.equal(alarm.accountId, 'account-1');
  assert.equal(alarm.type, 'gwBubble');
  assert.deepEqual(alarm.warnings, [60, 30, 15]);
  assert.equal(alarm.protected, true);
});

test('deduplicates by canonical id and retains the newest event', () => {
  const base = { source: 'partner' as const, sourceId: 'tgmhub', sourceEventId: 'same', title: 'Event', startAtUtc: '2026-09-06T18:00:00.000Z' };
  const oldEvent = normalizeExternalEvent(base, new Date('2026-09-06T05:00:00.000Z'));
  const newEvent = normalizeExternalEvent({ ...base, title: 'Updated Event' }, new Date('2026-09-06T06:00:00.000Z'));
  const result = deduplicateEvents([oldEvent, newEvent]);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.title, 'Updated Event');
});
