import { strict as assert } from 'node:assert';
import test from 'node:test';
import { MASTER_EVENT_CATALOG } from '../src/domain/eventCatalog';
import { generateOccurrences, mergeOccurrenceConfirmation } from '../src/domain/eventEngine';
import { evaluateNotificationHealth } from '../src/domain/notificationHealth';
import { acceptRemoteConfig, validateRemoteConfig, type RemoteEventConfig } from '../src/domain/remoteConfig';
import { PRODUCT_IDENTITIES, assertTrackBIdentity } from '../src/domain/productTracks';

test('catalog definitions generate deterministic personal-event occurrences', () => {
  const definition = MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event');
  assert.ok(definition);
  const from = new Date('2026-09-05T08:00:00.000Z');
  const until = new Date('2026-09-05T17:00:00.000Z');
  const first = generateOccurrences(definition, from, until);
  const second = generateOccurrences(definition, from, until);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.startUtc), [
    '2026-09-05T09:00:00.000Z',
    '2026-09-05T12:00:00.000Z',
    '2026-09-05T15:00:00.000Z',
  ]);
});

test('unconfirmed variants remain predicted until explicit confirmation', () => {
  const definition = MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event');
  assert.ok(definition);
  const occurrence = generateOccurrences(definition, new Date('2026-09-05T08:00:00.000Z'), new Date('2026-09-05T09:01:00.000Z'))[0];
  assert.ok(occurrence);
  assert.equal(occurrence.variant, null);
  assert.equal(occurrence.status, 'predicted');
  const confirmed = mergeOccurrenceConfirmation(occurrence, 'Construction', 0.97, 'community:tester');
  assert.equal(confirmed.variant, 'Construction');
  assert.equal(confirmed.status, 'communityConfirmed');
  assert.equal(confirmed.confidence, 0.97);
});

test('notification health returns the first actionable failure and all reasons', () => {
  const report = evaluateNotificationHealth({
    notificationsGranted: true,
    exactAlarmGranted: false,
    batteryRestricted: true,
    clockSkewMinutes: 4,
    recoveryPending: false,
    reconciliationRequired: true,
    scheduleError: false,
  });
  assert.equal(report.state, 'EXACT_ALARM_REQUIRED');
  assert.equal(report.healthy, false);
  assert.deepEqual(report.reasons, ['EXACT_ALARM_REQUIRED', 'BATTERY_RESTRICTION', 'CLOCK_SUSPECT', 'RECONCILIATION_REQUIRED']);
});

test('remote config requires valid structure, signature verification and monotonic versions', () => {
  const baseRule = MASTER_EVENT_CATALOG[0];
  const candidate: RemoteEventConfig = {
    schema: 3,
    configVersion: 2,
    gameVersionRange: ['1.5.0', '1.6.x'],
    effectiveFrom: '2026-09-05T00:00:00.000Z',
    rules: [baseRule],
    signature: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_==',
  };
  assert.deepEqual(validateRemoteConfig(candidate), []);
  assert.throws(() => acceptRemoteConfig(null, candidate, false), /signature verification failed/);
  const accepted = acceptRemoteConfig(null, candidate, true);
  assert.equal(accepted.configVersion, 2);
  assert.throws(() => acceptRemoteConfig(accepted, { ...candidate, configVersion: 2 }, true), /not newer/);
});

test('track B cannot silently opt into licensed assets or forbidden official identity', () => {
  assert.doesNotThrow(() => assertTrackBIdentity(PRODUCT_IDENTITIES.B));
  assert.throws(() => assertTrackBIdentity({ ...PRODUCT_IDENTITIES.B, usesLicensedAssets: true }), /licensed\/original assets/);
  assert.throws(() => assertTrackBIdentity({ ...PRODUCT_IDENTITIES.B, name: 'TGM Alarm Center' }), /unauthorized official affiliation/);
});
