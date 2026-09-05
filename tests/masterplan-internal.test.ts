import assert from 'node:assert/strict';
import test from 'node:test';
import { MASTER_EVENT_CATALOG } from '../src/domain/eventCatalog';
import { buildConsensus, validateEventReport, type EventReport } from '../src/domain/eventIntelligence';
import { generateOccurrences, mergeOccurrenceConfirmation } from '../src/domain/eventEngine';
import { evaluateNotificationHealth } from '../src/domain/notificationHealth';
import { buildNotificationPlan } from '../src/domain/notificationPlan';
import { acceptRemoteConfig, validateRemoteConfig, type RemoteEventConfig } from '../src/domain/remoteConfig';
import { PRODUCT_IDENTITIES, assertTrackBIdentity } from '../src/domain/productTracks';
import { validateEventDefinition } from '../src/domain/eventModel';
import { MAFIA_COMMAND_CENTER_TOKENS } from '../src/domain/designTokens';
import { buildNotificationPlan as buildNativeNotificationPlan, isWithinRollingNotificationWindow, NOTIFICATION_ROLLING_WINDOW_MS } from '../src/native/notificationSchedule';
import { type Alarm } from '../src/domain/alarm';
import { clearVerifiedNativeEntitlement, getNativeEntitlementState, setVerifiedNativeEntitlement } from '../src/billing/nativeEntitlementService';

test('all built-in event definitions satisfy the strict model contract', () => {
  for (const definition of MASTER_EVENT_CATALOG) assert.deepEqual(validateEventDefinition(definition), [], definition.id);
  assert.equal(MASTER_EVENT_CATALOG.length >= 30, true);
});

test('catalog definitions generate deterministic personal-event occurrences', () => {
  const definition = MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event');
  if (!definition) throw new Error('personal-event definition missing');
  const from = new Date('2026-09-05T08:00:00.000Z');
  const until = new Date('2026-09-05T17:00:00.000Z');
  const first = generateOccurrences(definition, from, until);
  const second = generateOccurrences(definition, from, until);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.startUtc), ['2026-09-05T09:00:00.000Z', '2026-09-05T12:00:00.000Z', '2026-09-05T15:00:00.000Z']);
});

test('daily local schedules honor IANA timezone offsets across DST transitions', () => {
  const definition = { ...MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event')!, id: 'daily-local-dst-test', ruleType: 'dailyLocal' as const, schedule: { ruleType: 'dailyLocal' as const, localTime: '09:00', timezoneId: 'Europe/Berlin' } };
  assert.deepEqual(validateEventDefinition(definition), []);
  const occurrences = generateOccurrences(definition, new Date('2026-10-24T00:00:00.000Z'), new Date('2026-10-26T23:59:59.999Z'));
  assert.deepEqual(occurrences.map((item) => item.startUtc), ['2026-10-24T07:00:00.000Z', '2026-10-25T08:00:00.000Z', '2026-10-26T08:00:00.000Z']);
});

test('invalid IANA timezones fail closed during event-definition validation', () => {
  const definition = { ...MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event')!, id: 'daily-local-invalid-timezone', ruleType: 'dailyLocal' as const, schedule: { ruleType: 'dailyLocal' as const, localTime: '09:00', timezoneId: 'Mars/Olympus' } };
  assert.equal(validateEventDefinition(definition).includes('invalid-timezone'), true);
  assert.throws(() => generateOccurrences(definition, new Date('2026-09-05T00:00:00.000Z'), new Date('2026-09-06T00:00:00.000Z')), /invalid-timezone/);
});

test('unconfirmed variants remain predicted until explicit confirmation', () => {
  const definition = MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event');
  if (!definition) throw new Error('personal-event definition missing');
  const occurrence = generateOccurrences(definition, new Date('2026-09-05T08:00:00.000Z'), new Date('2026-09-05T09:01:00.000Z'))[0];
  if (!occurrence) throw new Error('personal-event occurrence missing');
  assert.equal(occurrence.variant, null); assert.equal(occurrence.status, 'predicted');
  const confirmed = mergeOccurrenceConfirmation(occurrence, 'Construction', 0.97, 'community:tester');
  assert.equal(confirmed.variant, 'Construction'); assert.equal(confirmed.status, 'communityConfirmed'); assert.equal(confirmed.confidence, 0.97);
});

test('community reports produce weighted consensus and preserve conflicts', () => {
  const definition = MASTER_EVENT_CATALOG.find((item) => item.id === 'personal-event');
  if (!definition) throw new Error('personal-event definition missing');
  const occurrence = generateOccurrences(definition, new Date('2026-09-05T08:00:00.000Z'), new Date('2026-09-05T09:01:00.000Z'))[0];
  if (!occurrence) throw new Error('personal-event occurrence missing');
  const reports: EventReport[] = [
    { id: 'r-1', occurrenceId: occurrence.id, reporterId: 'alice', variant: 'Construction', startUtc: occurrence.startUtc, endUtc: null, reference: null, submittedAt: '2026-09-05T08:30:00.000Z' },
    { id: 'r-2', occurrenceId: occurrence.id, reporterId: 'bob', variant: 'Construction', startUtc: occurrence.startUtc, endUtc: null, reference: null, submittedAt: '2026-09-05T08:31:00.000Z' },
    { id: 'r-3', occurrenceId: occurrence.id, reporterId: 'alice', variant: 'Recruitment', startUtc: occurrence.startUtc, endUtc: null, reference: null, submittedAt: '2026-09-05T08:32:00.000Z' },
  ];
  const firstReport = reports[0]; if (!firstReport) throw new Error('first report missing');
  assert.deepEqual(validateEventReport(firstReport), []);
  const consensus = buildConsensus(occurrence, reports, [{ reporterId: 'alice', correctConfirmations: 8, consistentReports: 8, independentConfirmations: 4 }, { reporterId: 'bob', correctConfirmations: 4, consistentReports: 4, independentConfirmations: 2 }]);
  assert.equal(consensus.variant, 'construction'); assert.equal(consensus.disputed, true); assert.deepEqual(consensus.reportIds, ['r-1', 'r-2', 'r-3']);
});

test('notification plans use stable occurrence ownership ids and chronological order', () => {
  const occurrence = { id: 'personal-event@2026-09-05T09:00:00.000Z', definitionId: 'personal-event', definitionVersion: 1, startUtc: '2026-09-05T09:00:00.000Z', endUtc: '2026-09-05T09:55:00.000Z', variant: null, status: 'predicted' as const, confidence: 1, sourceRefs: ['internal-masterplan'], metadata: {} };
  const plan = buildNotificationPlan(occurrence, [{ kind: 'end' }, { kind: 'warning', minutesBefore: 15 }, { kind: 'start' }, { kind: 'end-warning', minutesBefore: 10 }]);
  assert.deepEqual(plan.map((item) => item.atUtc), ['2026-09-05T08:45:00.000Z', '2026-09-05T09:00:00.000Z', '2026-09-05T09:45:00.000Z', '2026-09-05T09:55:00.000Z']);
  assert.equal(new Set(plan.map((item) => item.id)).size, 4);
});

test('notification health returns the first actionable failure and all reasons', () => {
  const report = evaluateNotificationHealth({ notificationsGranted: true, exactAlarmGranted: false, batteryRestricted: true, clockSkewMinutes: 4, recoveryPending: false, reconciliationRequired: true, scheduleError: false });
  assert.equal(report.state, 'EXACT_ALARM_REQUIRED'); assert.equal(report.healthy, false); assert.deepEqual(report.reasons, ['EXACT_ALARM_REQUIRED', 'BATTERY_RESTRICTION', 'CLOCK_SUSPECT', 'RECONCILIATION_REQUIRED']);
});

test('remote config requires valid structure, signature verification and monotonic versions', () => {
  const baseRule = MASTER_EVENT_CATALOG[0]; if (!baseRule) throw new Error('catalog is empty');
  const candidate: RemoteEventConfig = { schema: 3, configVersion: 2, gameVersionRange: ['1.5.0', '1.6.x'], effectiveFrom: '2026-09-05T00:00:00.000Z', rules: [baseRule], signature: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_==' };
  assert.deepEqual(validateRemoteConfig(candidate), []); assert.throws(() => acceptRemoteConfig(null, candidate, false), /signature verification failed/);
  const accepted = acceptRemoteConfig(null, candidate, true); assert.equal(accepted.configVersion, 2); assert.throws(() => acceptRemoteConfig(accepted, { ...candidate, configVersion: 2 }, true), /not newer/);
});

test('Track B identity and design tokens are internally constrained', () => {
  assert.doesNotThrow(() => assertTrackBIdentity(PRODUCT_IDENTITIES.B));
  assert.throws(() => assertTrackBIdentity({ ...PRODUCT_IDENTITIES.B, usesLicensedAssets: true }), /licensed\/original assets/);
  assert.throws(() => assertTrackBIdentity({ ...PRODUCT_IDENTITIES.B, name: 'TGM Alarm Center' }), /unauthorized official affiliation/);
  assert.equal(MAFIA_COMMAND_CENTER_TOKENS.background, '#0B0D0F'); assert.equal(MAFIA_COMMAND_CENTER_TOKENS.gold, '#D1A84D');
});

test('rolling notification planner keeps near-term 100-alarm schedules bounded', () => {
  const now = new Date('2026-09-05T00:00:00.000Z');
  const prefs = { sound: 'pulse' as const, warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: false };
  const alarms: Alarm[] = Array.from({ length: 100 }, (_, index) => ({ id: `roll-100-${index}`, accountId: `account-${index % 5}`, title: `Alarm ${index}`, type: 'custom' as const, date: '2026-09-05', time: `${String(1 + (index % 7)).padStart(2, '0')}:00`, eventAtUtc: new Date(now.getTime() + (index % 7) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), warnings: [15], repeat: 'once' as const, sound: 'pulse' as const, active: true, protected: false, completedOccurrences: {}, createdAt: now.toISOString(), updatedAt: now.toISOString() }));
  const first = buildNativeNotificationPlan(alarms, prefs, now); const second = buildNativeNotificationPlan(alarms, prefs, now);
  assert.deepEqual(first, second); assert.equal(first.length, 200); assert.equal(first.every((entry) => isWithinRollingNotificationWindow(new Date(entry.at), now)), true); assert.equal(first.every((entry) => Date.parse(entry.at) <= now.getTime() + NOTIFICATION_ROLLING_WINDOW_MS), true);
});

test('rolling notification planner excludes out-of-window 500-alarm schedules while preserving all near-term alarms', () => {
  const now = new Date('2026-09-05T00:00:00.000Z');
  const prefs = { sound: 'pulse' as const, warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: false };
  const alarms: Alarm[] = Array.from({ length: 500 }, (_, index) => {
    const offsetDays = index % 10; const event = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
    return { id: `roll-500-${index}`, accountId: `account-${index % 10}`, title: `Alarm ${index}`, type: 'custom' as const, date: event.toISOString().slice(0, 10), time: '01:00', eventAtUtc: event.toISOString(), warnings: [15], repeat: 'once' as const, sound: 'pulse' as const, active: true, protected: false, completedOccurrences: {}, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  });
  const plan = buildNativeNotificationPlan(alarms, prefs, now);
  assert.equal(plan.length, 700); assert.equal(plan.every((entry) => isWithinRollingNotificationWindow(new Date(entry.at), now)), true); assert.equal(new Set(plan.map((entry) => entry.alarmId)).size, 350);
});

test('persisted paid tier cannot unlock native features without verified entitlement', () => {
  clearVerifiedNativeEntitlement();
  const tamperedTier = 'godfather' as const;
  const state = getNativeEntitlementState('ordinary-player', tamperedTier);
  assert.equal(state.tier, 'free');
  assert.equal(state.source, 'none');
});

test('only active unexpired server entitlement unlocks native premium features', () => {
  clearVerifiedNativeEntitlement();
  const base = { status: 'active' as const, tier: 'streetBoss' as const, productKey: 'street-boss-monthly', productId: 'street-boss-monthly', platform: 'android' as const, environment: 'production' as const, expiresAt: '2026-09-06T00:00:00.000Z', verifiedAt: '2026-09-05T00:00:00.000Z', source: 'server' as const };
  setVerifiedNativeEntitlement(base);
  assert.equal(getNativeEntitlementState('ordinary-player', 'free').tier, 'streetBoss');
  clearVerifiedNativeEntitlement();
  setVerifiedNativeEntitlement({ ...base, status: 'expired', expiresAt: '2026-09-04T00:00:00.000Z' });
  assert.equal(getNativeEntitlementState('ordinary-player', 'godfather').tier, 'free');
  clearVerifiedNativeEntitlement();
});
