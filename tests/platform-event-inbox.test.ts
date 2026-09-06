import { describe, expect, test } from 'node:test';
import { alarmFromEvent } from '../src/platform/eventToAlarm';
import { canAddEventAlarm, dismissInboxEvent, markInboxEventAdded, recommendEvents, upsertInboxEvent, type EventInboxItem } from '../src/platform/eventInbox';
import type { AlarmableEvent } from '../src/platform/alarmableEvent';
import type { Alarm } from '../src/domain/alarm';

const baseEvent = (overrides: Partial<AlarmableEvent> = {}): AlarmableEvent => ({
  id: 'manual:device:1',
  source: 'manual',
  sourceId: 'device',
  sourceEventId: '1',
  title: 'Super Weapon',
  description: 'Start',
  category: 'event',
  startAtUtc: '2026-09-07T12:00:00.000Z',
  endAtUtc: null,
  timezone: 'Europe/Berlin',
  priority: 'critical',
  alarmType: 'custom',
  repeat: 'once',
  warningMinutes: [60, 15],
  sound: 'siren',
  action: 'notify',
  metadata: {},
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
  ...overrides,
});

const baseAlarm = (overrides: Partial<Alarm> = {}): Alarm => ({
  id: 'alarm-1',
  accountId: 'account-1',
  title: 'Existing',
  type: 'custom',
  date: '2026-09-08',
  time: '14:00',
  eventAtUtc: '2026-09-08T12:00:00.000Z',
  warnings: [15],
  repeat: 'once',
  sound: 'chime',
  active: true,
  protected: false,
  completedOccurrences: {},
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
  ...overrides,
});

test('upsertInboxEvent adds and updates one canonical event without duplication', () => {
  const first = upsertInboxEvent([], baseEvent());
  expect(first).toHaveLength(1);
  const updated = upsertInboxEvent(first, baseEvent({ title: 'Super Weapon updated', updatedAt: '2026-09-06T01:00:00.000Z' }));
  expect(updated).toHaveLength(1);
  expect(updated[0].event.title).toBe('Super Weapon updated');
});

test('recommendEvents prioritizes critical upcoming events', () => {
  const critical = baseEvent({ id: 'manual:device:critical', sourceEventId: 'critical', priority: 'critical', startAtUtc: '2026-09-07T12:00:00.000Z' });
  const low = baseEvent({ id: 'manual:device:low', sourceEventId: 'low', priority: 'low', startAtUtc: '2026-09-10T12:00:00.000Z' });
  const items: EventInboxItem[] = [
    { event: low, status: 'new', receivedAt: '2026-09-06T00:00:00.000Z' },
    { event: critical, status: 'new', receivedAt: '2026-09-06T00:00:00.000Z' },
  ];
  const recommendations = recommendEvents(items, [], new Date('2026-09-06T00:00:00.000Z'));
  expect(recommendations[0].event.id).toBe(critical.id);
  expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
});

test('dismiss and add states are explicit and idempotent', () => {
  const item: EventInboxItem = { event: baseEvent(), status: 'new', receivedAt: '2026-09-06T00:00:00.000Z' };
  const dismissed = dismissInboxEvent([item], item.event.id, new Date('2026-09-06T01:00:00.000Z'));
  expect(dismissed[0].status).toBe('dismissed');
  const added = markInboxEventAdded([item], item.event.id, 'event:manual:device:1');
  expect(added[0].status).toBe('added');
  expect(added[0].addedAlarmId).toBe('event:manual:device:1');
});

test('canAddEventAlarm enforces the existing event category limit', () => {
  const event = baseEvent();
  const decision = canAddEventAlarm('free', [baseAlarm()], 'account-1', event);
  expect(decision.allowed).toBe(false);
  expect(decision.reason).toContain('Kategorie');
});

test('alarmFromEvent keeps the same instant while presenting local device date and time', () => {
  const event = baseEvent({ startAtUtc: '2026-09-07T12:00:00.000Z' });
  const alarm = alarmFromEvent(event, { accountId: 'account-1', now: new Date('2026-09-06T00:00:00.000Z') });
  expect(alarm.eventAtUtc).toBe('2026-09-07T12:00:00.000Z');
  expect(alarm.id).toBe('event:manual:device:1');
  expect(alarm.date).toBe(new Date('2026-09-07T12:00:00.000Z').toLocaleDateString('sv-SE'));
});
