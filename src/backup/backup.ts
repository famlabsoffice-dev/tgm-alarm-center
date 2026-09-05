import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppState } from '../domain/alarm';
import { MAX_BACKUP_BYTES, makeBackup as makeBackupContract, validateBackup as validateBackupContract, stripEntitlement, type Backup } from './backupContract';

export { FORMAT, VERSION, MAX_BACKUP_BYTES, stripEntitlement, type Backup } from './backupContract';

export function makeBackup(data: AppState): Backup {
  if (!data.accounts || !Array.isArray(data.accounts)) throw new Error('Backup-Struktur ist ungültig');
  return { ...makeBackupContract(data), data: stripEntitlement(data) };
}

export function validateBackup(value: unknown): Backup {
  const backup = validateBackupContract(value);
  const data = backup.data;
  if (!Array.isArray(data.accounts) || !Array.isArray(data.alarms)) throw new Error('Backup-Struktur ist ungültig');
  return backup;
}

export function restoreBackup(payload: string | unknown): AppState {
  if (typeof payload === 'string' && payload.length > MAX_BACKUP_BYTES) throw new Error('Backup-Datei ist zu groß');
  const parsed = typeof payload === 'string' ? JSON.parse(payload) as unknown : payload;
  return stripEntitlement(validateBackup(parsed).data);
}

export async function exportBackup(data: AppState): Promise<void> {
  const file = `${FileSystem.cacheDirectory}tgm-alarm-center-${Date.now()}.json`;
  const payload = JSON.stringify(makeBackup(data), null, 2);
  if (payload.length > MAX_BACKUP_BYTES) throw new Error('Backup-Datei wäre zu groß');
  await FileSystem.writeAsStringAsync(file, payload, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
  await Sharing.shareAsync(file, { mimeType: 'application/json', dialogTitle: 'TGM ALARM CENTER Backup' });
}
