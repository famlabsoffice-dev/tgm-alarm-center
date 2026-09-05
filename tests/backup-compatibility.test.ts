import assert from 'node:assert/strict';
import test from 'node:test';
import { makeBackup, restoreBackup, validateBackup, type Backup } from '../src/backup/backup';
import type { AppState } from '../src/domain/alarm';

const baseState = (tier: AppState['tier'] = 'free', activeAccountId: string | null = 'account-1', testConfirmedAt: string | null = null): AppState => ({
  schemaVersion: 1,
  accounts: [{ id: 'account-1', name: 'Alpha', color: '#D1A84D', createdAt: '2026-09-05T00:00:00.000Z' }],
  alarms: [{
    id: 'alarm-1', accountId: 'account-1', title: 'Bubble', type: 'bubble', date: '2026-09-05', time: '12:00', eventAtUtc: '2026-09-05T10:00:00.000Z',
    warnings: [60, 15], repeat: 'once', sound: 'pulse', active: true, protected: true, completedOccurrences: {},
    createdAt: '2026-09-05T00:00:00.000Z', updatedAt: '2026-09-05T00:00:00.000Z',
  }],
  activeAccountId, tier,
  notificationPreferences: { sound: 'pulse', warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: false },
  testConfirmedAt,
});

test('schema-1 export strips every supported persisted tier', () => {
  const tiers: AppState['tier'][] = ['free', 'streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'];
  for (const tier of tiers) {
    const backup = makeBackup(baseState(tier));
    assert.equal(backup.format, 'tgm-alarm-center-backup');
    assert.equal(backup.version, 1);
    assert.equal(backup.schemaVersion, 1);
    assert.equal(backup.data.tier, 'free', `tier ${tier} must never cross the backup entitlement boundary`);
  }
});

test('schema-1 validator accepts every supported state representation', () => {
  const variants = [baseState('free', null, null), baseState('streetBoss', 'account-1', '2026-09-05T01:00:00.000Z'), baseState('caporegime'), baseState('underboss'), baseState('boss'), baseState('godfather')];
  for (const state of variants) {
    const backup = makeBackup(state);
    assert.deepEqual(validateBackup(backup), backup);
    assert.deepEqual(restoreBackup(JSON.stringify(backup)), { ...backup.data, tier: 'free' });
  }
});

test('restore strips a forged paid tier even when the rest of the payload is valid', () => {
  const source = makeBackup(baseState('godfather'));
  const forged: Backup = { ...source, data: { ...source.data, tier: 'godfather' } };
  assert.equal(validateBackup(forged).data.tier, 'godfather');
  assert.equal(restoreBackup(forged).tier, 'free');
});

test('validator rejects duplicate ids and dangling cross-references', () => {
  const backup = makeBackup(baseState());
  const duplicateAccount = { ...backup, data: { ...backup.data, accounts: [...backup.data.accounts, backup.data.accounts[0]!] } };
  assert.throws(() => validateBackup(duplicateAccount), /Ungültige Accountdaten/);
  const danglingAlarm = { ...backup, data: { ...backup.data, alarms: [{ ...backup.data.alarms[0]!, accountId: 'missing-account' }] } };
  assert.throws(() => validateBackup(danglingAlarm), /Ungültige Alarmdaten/);
  const danglingActive = { ...backup, data: { ...backup.data, activeAccountId: 'missing-account' } };
  assert.throws(() => validateBackup(danglingActive), /Aktiver Account fehlt/);
});

test('validator rejects malformed, oversized and unknown top-level restore payloads before state use', () => {
  const backup = makeBackup(baseState());
  assert.throws(() => validateBackup({ ...backup, version: 2 }), /nicht kompatibel/);
  assert.throws(() => validateBackup({ ...backup, schemaVersion: 2 }), /nicht kompatibel/);
  assert.throws(() => validateBackup({ ...backup, receivedFrom: 'unknown-source' }), /nicht kompatibel/);
  assert.throws(() => validateBackup({ ...backup, data: { ...backup.data, notificationPreferences: { ...backup.data.notificationPreferences, sound: 'laser' } } }), /Notification-Einstellungen/);
  assert.throws(() => validateBackup({ ...backup, data: { ...backup.data, alarms: [{ ...backup.data.alarms[0]!, warnings: [0] }] } }), /Ungültige Alarmdaten/);
  assert.throws(() => restoreBackup('x'.repeat(512 * 1024 + 1)), /zu groß/);
});

test('validator enforces the bounded schema-1 collection sizes', () => {
  const backup = makeBackup(baseState());
  const tooManyAccounts = Array.from({ length: 51 }, (_, index) => ({ ...backup.data.accounts[0]!, id: `account-${index}` }));
  assert.throws(() => validateBackup({ ...backup, data: { ...backup.data, accounts: tooManyAccounts } }), /Backup-Struktur/);
  const tooManyAlarms = Array.from({ length: 501 }, (_, index) => ({ ...backup.data.alarms[0]!, id: `alarm-${index}` }));
  assert.throws(() => validateBackup({ ...backup, data: { ...backup.data, alarms: tooManyAlarms } }), /Backup-Struktur/);
});
