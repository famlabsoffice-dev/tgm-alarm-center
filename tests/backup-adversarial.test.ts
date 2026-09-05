import assert from 'node:assert/strict';
import test from 'node:test';
import { makeBackup, restoreBackup } from '../src/backup/backup';
import type { AppState } from '../src/domain/alarm';

const state: AppState = {
  schemaVersion: 1,
  accounts: [{ id: 'a1', name: 'Alpha', color: '#F0C76A', createdAt: '2026-09-05T00:00:00.000Z' }],
  alarms: [],
  activeAccountId: 'a1',
  tier: 'godfather',
  notificationPreferences: { sound: 'pulse', warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: true },
  testConfirmedAt: null,
};

test('backup export strips paid entitlement', () => {
  assert.equal(makeBackup(state).data.tier, 'free');
});

test('backup restore rejects an alarm referencing a missing account', () => {
  const backup = makeBackup(state);
  const malformed = {
    ...backup,
    data: {
      ...backup.data,
      alarms: [{ id: 'bad', accountId: 'missing', title: 'Bad', type: 'custom', date: '2026-09-05', time: '10:00', eventAtUtc: '2026-09-05T08:00:00.000Z', warnings: [15], repeat: 'once', sound: 'pulse', active: true, protected: false, completedOccurrences: {}, createdAt: '2026-09-05T00:00:00.000Z', updatedAt: '2026-09-05T00:00:00.000Z' }],
    },
  };
  assert.throws(() => restoreBackup(malformed), /Ungültige Alarmdaten/);
});

test('backup restore rejects duplicate account and alarm identities', () => {
  const backup = makeBackup(state);
  const duplicateAccount = { ...backup, data: { ...backup.data, accounts: [...backup.data.accounts, backup.data.accounts[0]] } };
  assert.throws(() => restoreBackup(duplicateAccount), /Ungültige Accountdaten/);

  const alarm = { id: 'same', accountId: 'a1', title: 'Valid', type: 'custom', date: '2026-09-05', time: '10:00', eventAtUtc: '2026-09-05T08:00:00.000Z', warnings: [15], repeat: 'once', sound: 'pulse', active: true, protected: false, completedOccurrences: {}, createdAt: '2026-09-05T00:00:00.000Z', updatedAt: '2026-09-05T00:00:00.000Z' };
  const duplicateAlarm = { ...backup, data: { ...backup.data, alarms: [alarm, alarm] } };
  assert.throws(() => restoreBackup(duplicateAlarm), /Ungültige Alarmdaten/);
});

test('backup restore rejects oversized payload before parsing', () => {
  assert.throws(() => restoreBackup('x'.repeat(512 * 1024 + 1)), /zu groß/);
});

test('backup restore rejects malformed JSON and invalid active-account references', () => {
  assert.throws(() => restoreBackup('{not-json'), /Unexpected token/);
  const malformed = { ...makeBackup(state), data: { ...makeBackup(state).data, activeAccountId: 'missing' } };
  assert.throws(() => restoreBackup(malformed), /Aktiver Account fehlt/);
});
