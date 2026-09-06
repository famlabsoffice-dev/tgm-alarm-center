import test from 'node:test';
import assert from 'node:assert/strict';
import { firstPartyUtilityEvent, firstPartyUtilityEvents } from '../src/platform/firstPartyUtility';

test('first-party utilities normalize into alarmable events', () => {
  const event = firstPartyUtilityEvent({
    utility: 'gw',
    id: 'gw-1',
    title: 'GW starts',
    startAtUtc: '2026-09-07T18:00:00.000Z',
    endAtUtc: '2026-09-08T18:00:00.000Z',
    priority: 'critical',
    warningMinutes: [60, 15],
  });

  assert.equal(event.source, 'native');
  assert.equal(event.sourceId, 'tgm-alarm-center');
  assert.equal(event.sourceEventId, 'gw:gw-1');
  assert.equal(event.category, 'gw');
  assert.equal(event.alarmType, 'gwBubble');
  assert.deepEqual(event.warningMinutes, [60, 15]);
  assert.equal(event.metadata?.utility, 'gw');
});

test('first-party utility collection is deterministic and deduplicated', () => {
  const events = firstPartyUtilityEvents([
    { utility: 'bubble', id: 'b-2', title: 'Bubble 2', startAtUtc: '2026-09-07T20:00:00.000Z' },
    { utility: 'resource', id: 'r-1', title: 'Resource', startAtUtc: '2026-09-07T19:00:00.000Z' },
    { utility: 'bubble', id: 'b-1', title: 'Bubble 1', startAtUtc: '2026-09-07T18:00:00.000Z' },
    { utility: 'bubble', id: 'b-2', title: 'Bubble 2 duplicate', startAtUtc: '2026-09-07T20:00:00.000Z' },
  ]);

  assert.equal(events.length, 3);
  assert.deepEqual(events.map((event) => event.sourceEventId), ['bubble:b-1', 'resource:r-1', 'bubble:b-2']);
});
