import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyFunnelSnapshot, funnelConversion, funnelProgress, parseFunnelSnapshot, recordFunnelStage, serializeFunnelSnapshot } from '../src/domain/funnelDiagnostics';
import { importShareableTemplate, makeShareableTemplate, serializeShareableTemplate, SHAREABLE_TEMPLATE_FORMAT } from '../src/domain/shareableTemplates';
import { evaluateNotificationHealth, notificationHealthUserCopy, type NotificationHealthInput } from '../src/domain/notificationHealth';

test('local funnel diagnostics remain bounded, ordered and content-free', () => {
  let snapshot = emptyFunnelSnapshot();
  snapshot = recordFunnelStage(snapshot, 'install', '2026-09-05T10:00:00.000Z');
  snapshot = recordFunnelStage(snapshot, 'first_alarm', '2026-09-05T10:01:00.000Z');
  snapshot = recordFunnelStage(snapshot, 'notification_engagement', '2026-09-05T10:02:00.000Z');
  snapshot = recordFunnelStage(snapshot, 'return', '2026-09-06T10:00:00.000Z');
  assert.equal(funnelProgress(snapshot), 1);
  assert.deepEqual(funnelConversion(snapshot), { installToFirstAlarm: 1, firstAlarmToEngagement: 1, engagementToReturn: 1 });
  const encoded = serializeFunnelSnapshot(snapshot);
  assert.equal(encoded.includes('account'), false);
  assert.deepEqual(parseFunnelSnapshot(JSON.parse(encoded)), snapshot);
  assert.throws(() => parseFunnelSnapshot({ ...snapshot, schemaVersion: 2 }), /nicht kompatibel/);
});

test('shareable templates never carry account or occurrence identity', () => {
  const source = { title: 'Saturday Bubble', type: 'bubble' as const, warnings: [60, 15], repeat: 'gw5d' as const, sound: 'siren' as const, protected: true };
  const shared = makeShareableTemplate(source);
  assert.equal(shared.format, SHAREABLE_TEMPLATE_FORMAT);
  assert.equal(Object.prototype.hasOwnProperty.call(shared, 'accountId'), false);
  const imported = importShareableTemplate(serializeShareableTemplate(source));
  assert.deepEqual(imported, source);
  assert.throws(() => importShareableTemplate({ ...shared, warnings: [0] }), /Warnungen/);
  assert.throws(() => importShareableTemplate({ ...shared, title: 'x'.repeat(81) }), /Titel/);
});

test('notification health maps technical states to explicit consumer language', () => {
  const scenarios: Array<[NotificationHealthInput, string]> = [
    [{ notificationsGranted: false, exactAlarmGranted: false, batteryRestricted: false, clockSkewMinutes: 0, recoveryPending: false, reconciliationRequired: false, scheduleError: false }, 'Berechtigung fehlt'],
    [{ notificationsGranted: true, exactAlarmGranted: false, batteryRestricted: false, clockSkewMinutes: 0, recoveryPending: false, reconciliationRequired: false, scheduleError: false }, 'Exakte Alarme nicht aktiviert'],
    [{ notificationsGranted: true, exactAlarmGranted: true, batteryRestricted: true, clockSkewMinutes: 0, recoveryPending: false, reconciliationRequired: false, scheduleError: false }, 'Batterieschutz kann Zustellung verzögern'],
    [{ notificationsGranted: true, exactAlarmGranted: true, batteryRestricted: false, clockSkewMinutes: 0, recoveryPending: false, reconciliationRequired: false, scheduleError: false }, 'Benachrichtigungen sind bereit'],
  ];
  for (const [input, expected] of scenarios) assert.equal(notificationHealthUserCopy(evaluateNotificationHealth(input)).headline, expected);
});
