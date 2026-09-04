import assert from 'node:assert/strict';
import test from 'node:test';
import { TEMPLATES, Alarm, buildAlarm, occurrenceKey } from '../src/domain/alarm';
import {
  completeAccountOccurrence,
  deleteAccountAlarm,
  toggleAccountAlarm,
  updateAccountAlarm,
} from '../src/domain/accountAlarmActions';

const makeAlarms = (): [Alarm, Alarm] => {
  const now = new Date('2029-01-01T00:00:00.000Z');
  return [
    buildAlarm(TEMPLATES.custom, 'account-1', '2030-08-01', '03:00', now),
    buildAlarm(TEMPLATES.custom, 'account-2', '2030-08-01', '04:00', now),
  ];
};

test('updateAccountAlarm mutates only an explicitly owned alarm', () => {
  const [accountOne, accountTwo] = makeAlarms();
  const alarms = [accountOne, accountTwo];

  let called = false;
  const rejected = updateAccountAlarm(alarms, 'account-2', accountOne.id, (alarm) => {
    called = true;
    return { ...alarm, title: 'ILLEGAL' };
  });
  assert.equal(called, false);
  assert.equal(rejected[0], accountOne);
  assert.equal(rejected[1], accountTwo);

  const updated = updateAccountAlarm(alarms, 'account-1', accountOne.id, (alarm) => ({ ...alarm, title: 'Updated' }));
  assert.equal(updated[0]?.title, 'Updated');
  assert.equal(updated[1], accountTwo);
});

test('deleteAccountAlarm cannot delete an alarm owned by another account', () => {
  const [accountOne, accountTwo] = makeAlarms();
  const alarms = [accountOne, accountTwo];

  assert.deepEqual(deleteAccountAlarm(alarms, 'account-2', accountOne.id), alarms);
  assert.deepEqual(deleteAccountAlarm(alarms, null, accountOne.id), alarms);
  assert.deepEqual(deleteAccountAlarm(alarms, 'account-1', accountOne.id), [accountTwo]);
});

test('toggleAccountAlarm is account-scoped and preserves foreign alarm identity', () => {
  const [accountOne, accountTwo] = makeAlarms();
  const alarms = [accountOne, accountTwo];
  const updated = toggleAccountAlarm(alarms, 'account-1', accountOne.id, '2030-01-01T00:00:00.000Z');

  assert.equal(updated[0]?.active, !accountOne.active);
  assert.equal(updated[0]?.updatedAt, '2030-01-01T00:00:00.000Z');
  assert.equal(updated[1], accountTwo);
});

test('completeAccountOccurrence cannot complete a foreign alarm occurrence', () => {
  const [accountOne, accountTwo] = makeAlarms();
  const alarms = [accountOne, accountTwo];
  const occurrenceId = occurrenceKey(accountOne.id, new Date(accountOne.eventAtUtc));

  const rejected = completeAccountOccurrence(alarms, 'account-2', accountOne.id, occurrenceId, '2030-01-01T00:00:00.000Z');
  assert.equal(rejected[0], accountOne);
  assert.equal(rejected[0]?.completedOccurrences[occurrenceId], undefined);
  assert.equal(rejected[1], accountTwo);

  const completed = completeAccountOccurrence(alarms, 'account-1', accountOne.id, occurrenceId, '2030-01-01T00:00:00.000Z');
  assert.equal(completed[0]?.completedOccurrences[occurrenceId], true);
  assert.equal(completed[1], accountTwo);
});

test('missing account context is always a safe no-op', () => {
  const [accountOne, accountTwo] = makeAlarms();
  const alarms = [accountOne, accountTwo];
  assert.deepEqual(updateAccountAlarm(alarms, undefined, accountOne.id, (alarm) => ({ ...alarm, title: 'BAD' })), alarms);
  assert.deepEqual(deleteAccountAlarm(alarms, undefined, accountOne.id), alarms);
  assert.deepEqual(toggleAccountAlarm(alarms, undefined, accountOne.id, '2030-01-01T00:00:00.000Z'), alarms);
});
