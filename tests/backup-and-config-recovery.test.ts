import assert from 'node:assert/strict';
import test from 'node:test';
import { makeBackup } from '../src/backup/backup';
import { migrateBackupPayload, rollbackBackupV2ToV1, validateBackupV2 } from '../src/backup/backupMigrations';
import { MASTER_EVENT_CATALOG } from '../src/domain/eventCatalog';
import { acceptIntoHistory, emptyRemoteConfigHistory, parseRemoteConfigHistory, rollbackToPreviousKnownGood } from '../src/domain/remoteConfigHistory';
import type { RemoteEventConfig } from '../src/domain/remoteConfig';

const config = (version: number): RemoteEventConfig => ({ schema: 3, configVersion: version, gameVersionRange: ['1.5.0', '1.6.x'], effectiveFrom: `2026-09-0${version}T00:00:00.000Z`, rules: [MASTER_EVENT_CATALOG[0]!], signature: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_==' });

test('backup v1 upgrades to v2 and can safely roll back', () => {
  const data = { schemaVersion: 1 as const, accounts: [], alarms: [], activeAccountId: null, tier: 'free' as const, notificationPreferences: { sound: 'pulse' as const, warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: true }, testConfirmedAt: null };
  const v1 = makeBackup(data);
  const v2 = migrateBackupPayload(v1);
  assert.equal(v2.version, 2);
  assert.deepEqual(v2.migrations, ['backup-v1-to-v2']);
  assert.deepEqual(rollbackBackupV2ToV1(validateBackupV2(v2)), v1);
  assert.throws(() => migrateBackupPayload({ ...v1, version: 99 }), /Unbekannte Backup-Version/);
});

test('remote config history keeps the last known-good versions and permits explicit rollback', () => {
  let history = emptyRemoteConfigHistory();
  history = acceptIntoHistory(history, config(1), true);
  history = acceptIntoHistory(history, config(2), true);
  history = acceptIntoHistory(history, config(3), true);
  assert.equal(history.active?.configVersion, 3);
  assert.deepEqual(history.previous.map((item) => item.configVersion), [2, 1]);
  const rolledBack = rollbackToPreviousKnownGood(history, 2);
  assert.equal(rolledBack.active?.configVersion, 2);
  assert.deepEqual(rolledBack.previous.map((item) => item.configVersion), [3, 1]);
  assert.deepEqual(parseRemoteConfigHistory(JSON.parse(JSON.stringify(history))), history);
});
