import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppState } from '../domain/alarm';
import {
  FORMAT,
  VERSION,
  MAX_BACKUP_BYTES,
  makeBackup,
  restoreBackup,
  validateBackup,
  stripEntitlement,
  type Backup,
} from './backupContract';

export { FORMAT, VERSION, MAX_BACKUP_BYTES, makeBackup, restoreBackup, validateBackup, stripEntitlement, type Backup } from './backupContract';

export async function exportBackup(data: AppState): Promise<void> {
  const file = `${FileSystem.cacheDirectory}tgm-alarm-center-${Date.now()}.json`;
  const payload = JSON.stringify(makeBackup(data), null, 2);
  if (payload.length > MAX_BACKUP_BYTES) throw new Error('Backup-Datei wäre zu groß');
  await FileSystem.writeAsStringAsync(file, payload, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
  await Sharing.shareAsync(file, { mimeType: 'application/json', dialogTitle: 'TGM ALARM CENTER Backup' });
}
