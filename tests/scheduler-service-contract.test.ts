import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync('App.tsx', 'utf8');
const scheduler = fs.readFileSync('src/native/schedulerService.ts', 'utf8');

test('App delegates notification reconciliation to the Scheduler Service boundary', () => {
  assert.match(app, /reconcileAlarmNotifications\(state\.alarms, state\.notificationPreferences\)/u);
  assert.doesNotMatch(app, /activeAlarmsForNotification|cancelAllScheduled|scheduleAlarm\(/u);
});

test('Scheduler Service delegates to the single native reconciliation implementation', () => {
  assert.match(scheduler, /reconcileScheduledNotifications\(alarms, preferences\)/u);
  assert.match(scheduler, /export async function reconcileAlarmNotifications/u);
});
