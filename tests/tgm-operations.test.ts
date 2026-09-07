import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGwCommandCenter, buildPersonalTgmCalendar, factionReminderToAlarm, goalToAlarm, plannerResultToAlarm } from '../src/domain/tgmOperations';

test('planner results become canonical alarm intents', () => {
  const intent = plannerResultToAlarm({
    id: 'event-1',
    title: 'Lucky Sprint',
    accountId: 'account-1',
    category: 'event',
    startAtUtc: '2026-09-08T12:00:00.000Z',
    endAtUtc: '2026-09-08T18:00:00.000Z',
  });
  assert.equal(intent.sourceEventId, 'event-1');
  assert.equal(intent.accountId, 'account-1');
  assert.equal(intent.type, 'custom');
  assert.deepEqual(intent.warnings, [15]);
  assert.equal(intent.metadata.utility, 'event');
  assert.equal(intent.metadata.endAtUtc, '2026-09-08T18:00:00.000Z');
});

test('goal planner results produce deadline alarms with progress metadata', () => {
  const intent = goalToAlarm({
    id: 'insignia-1',
    title: 'Insignia Goal',
    accountId: 'account-1',
    category: 'insignia-goal',
    startAtUtc: '2026-09-01T12:00:00.000Z',
    endAtUtc: null,
    deadlineAtUtc: '2026-10-01T12:00:00.000Z',
    current: 5200,
    target: 7443,
    unit: 'Insignias',
  });
  assert.equal(intent.eventAtUtc, '2026-10-01T12:00:00.000Z');
  assert.equal(intent.metadata.remaining, 2243);
  assert.equal(intent.metadata.unit, 'Insignias');
  assert.equal(intent.repeat, 'daily');
});

test('faction reminder is rejected when no members are missing', () => {
  assert.throws(() => factionReminderToAlarm({
    id: 'donation-check', title: 'Faction Donation Check', accountId: 'account-1', category: 'faction',
    startAtUtc: '2026-09-08T21:00:00.000Z', endAtUtc: null, missingMembers: 0, totalMembers: 87,
  }), /Keine fehlenden Mitglieder/);
});

test('GW command center creates deterministic phase alarms', () => {
  const intents = buildGwCommandCenter({
    accountId: 'account-1', cycleId: 'gw-2026-09',
    startAtUtc: '2026-09-10T12:00:00.000Z', endAtUtc: '2026-09-11T12:00:00.000Z',
    bubbleAtUtc: '2026-09-10T11:00:00.000Z', rewardDeadlineAtUtc: '2026-09-11T18:00:00.000Z', prepAtUtc: '2026-09-09T12:00:00.000Z',
  });
  assert.deepEqual(intents.map((intent) => intent.sourceEventId), ['gw-prep:gw-2026-09', 'gw-bubble:gw-2026-09', 'gw-start:gw-2026-09', 'gw-end:gw-2026-09', 'gw-reward:gw-2026-09']);
  assert.ok(intents.every((intent) => intent.protected));
});

test('personal TGM calendar preserves account and utility ordering', () => {
  const entries = buildPersonalTgmCalendar([
    plannerResultToAlarm({ id: 'b', title: 'Goal', accountId: 'b', category: 'resource-goal', startAtUtc: '2026-09-09T10:00:00.000Z', endAtUtc: null }),
    plannerResultToAlarm({ id: 'a', title: 'GW', accountId: 'a', category: 'gw', startAtUtc: '2026-09-09T09:00:00.000Z', endAtUtc: '2026-09-10T09:00:00.000Z' }),
  ]);
  const first = entries.at(0);
  const second = entries.at(1);
  assert.ok(first);
  assert.ok(second);
  assert.deepEqual(entries.map((entry) => entry.id), ['a', 'b']);
  assert.equal(first.source, 'gw');
  assert.equal(second.source, 'goal');
  assert.equal(first.endsAtUtc, '2026-09-10T09:00:00.000Z');
});