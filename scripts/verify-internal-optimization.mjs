import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/domain/funnelDiagnostics.ts',
  'src/storage/funnelDiagnosticsStore.ts',
  'src/domain/shareableTemplates.ts',
  'src/domain/remoteConfigHistory.ts',
  'src/backup/backupMigrations.ts',
  'src/domain/notificationHealth.ts',
  'tests/phase9-internal-optimization.test.ts',
  'tests/backup-and-config-recovery.test.ts',
];

for (const path of requiredFiles) {
  const source = readFileSync(resolve(root, path), 'utf8');
  if (source.trim().length === 0) throw new Error(`Internal optimization file is empty: ${path}`);
}

const notificationHealth = readFileSync(resolve(root, 'src/domain/notificationHealth.ts'), 'utf8');
for (const required of ['PERMISSION_REQUIRED', 'EXACT_ALARM_REQUIRED', 'BATTERY_RESTRICTION', 'CLOCK_SUSPECT', 'RECOVERY_PENDING', 'RECONCILIATION_REQUIRED', 'SCHEDULE_ERROR']) {
  if (!notificationHealth.includes(required)) throw new Error(`Notification health state missing: ${required}`);
}

const funnel = readFileSync(resolve(root, 'src/domain/funnelDiagnostics.ts'), 'utf8');
for (const required of ['install', 'first_alarm', 'notification_engagement', 'return', 'MAX_EVENTS']) {
  if (!funnel.includes(required)) throw new Error(`Funnel contract missing: ${required}`);
}

const templates = readFileSync(resolve(root, 'src/domain/shareableTemplates.ts'), 'utf8');
if (!templates.includes('SHAREABLE_TEMPLATE_FORMAT') || !templates.includes('importShareableTemplate')) throw new Error('Shareable template contract missing');

const migrations = readFileSync(resolve(root, 'src/backup/backupMigrations.ts'), 'utf8');
for (const required of ['upgradeBackupV1ToV2', 'rollbackBackupV2ToV1', 'Unbekannte Backup-Version']) {
  if (!migrations.includes(required)) throw new Error(`Backup migration contract missing: ${required}`);
}

const configHistory = readFileSync(resolve(root, 'src/domain/remoteConfigHistory.ts'), 'utf8');
if (!configHistory.includes('rollbackToPreviousKnownGood')) throw new Error('Remote config rollback contract missing');

console.log('Internal optimization gate PASS');
