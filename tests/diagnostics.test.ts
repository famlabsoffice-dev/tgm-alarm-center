import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiagnosticEvent, LocalDiagnosticBuffer, MAX_DIAGNOSTIC_EVENTS, sanitizeMetadata, toCrashReportEnvelope } from '../src/domain/diagnostics';

test('diagnostic metadata uses an explicit privacy allowlist and finite scalar values', () => {
  const sanitized = sanitizeMetadata({ durationMs: 25, scheduledCount: 4, privateUserId: 'user-123', token: 'secret', ok: true, badNumber: Number.NaN, note: ' ready ' });
  assert.deepEqual(sanitized, { durationMs: 25, scheduledCount: 4 });
  assert.equal('privateUserId' in sanitized, false);
  assert.equal('token' in sanitized, false);
  assert.equal('ok' in sanitized, false);
  assert.equal('note' in sanitized, false);
});

test('diagnostic events reject invalid timestamps and preserve only bounded identity fields', () => {
  const event = createDiagnosticEvent({ type: 'incident', severity: 'error', appBuild: '  1.2.3  ', platform: 'android', code: '  CLOCK_SUSPECT  ', metadata: { incidentCode: 'clock' }, occurredAt: '2026-09-05T00:00:00.000Z', id: 'event-1' });
  assert.equal(event.id, 'event-1');
  assert.equal(event.appBuild, '1.2.3');
  assert.equal(event.code, 'CLOCK_SUSPECT');
  assert.equal(event.metadata.incidentCode, 'clock');
  assert.throws(() => createDiagnosticEvent({ type: 'incident', severity: 'error', appBuild: '1.2.3', platform: 'android', code: 'BROKEN', occurredAt: 'not-a-date' }), /Diagnostic-Zeitpunkt/);
});

test('local diagnostic buffer remains bounded and snapshot is detached', () => {
  const buffer = new LocalDiagnosticBuffer();
  for (let index = 0; index < MAX_DIAGNOSTIC_EVENTS + 25; index += 1) {
    buffer.record(createDiagnosticEvent({ type: 'notification.failure', severity: 'warning', appBuild: '1.0.0', platform: 'android', code: `N-${index}`, occurredAt: '2026-09-05T00:00:00.000Z' }));
  }
  const snapshot = buffer.snapshot();
  assert.equal(snapshot.length, MAX_DIAGNOSTIC_EVENTS);
  assert.equal(snapshot[0]?.code, 'N-25');
  assert.equal(snapshot[MAX_DIAGNOSTIC_EVENTS - 1]?.code, `N-${MAX_DIAGNOSTIC_EVENTS + 24}`);
  snapshot[0]!.metadata.result = 'mutated';
  assert.equal(buffer.snapshot()[0]?.metadata.result, undefined);
  buffer.clear();
  assert.equal(buffer.snapshot().length, 0);
});

test('crash envelope retains optional bounded stack evidence without requiring an endpoint', () => {
  const event = createDiagnosticEvent({ type: 'incident', severity: 'critical', appBuild: '1.0.0', platform: 'ios', code: 'NATIVE_CRASH' });
  assert.equal(toCrashReportEnvelope(event, 'Error: crash\n at screen:1').stack, 'Error: crash\n at screen:1');
  assert.deepEqual(toCrashReportEnvelope(event), { event });
});
