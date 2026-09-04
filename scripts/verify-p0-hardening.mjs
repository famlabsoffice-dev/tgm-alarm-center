import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const pricing = read('src/domain/pricing.ts');
const storage = read('src/storage/store.ts');
const backup = read('src/backup/backup.ts');
const notifications = read('src/native/notifications.ts');
const nativeIndex = read('modules/tgm-exact-alarm/index.ts');
const nativeModule = read('modules/tgm-exact-alarm/android/src/main/java/expo/modules/tgmalarm/TGMExactAlarmModule.kt');
const receiver = read('modules/tgm-exact-alarm/android/src/main/java/expo/modules/tgmalarm/TGMRecoveryReceiver.kt');
const manifest = read('modules/tgm-exact-alarm/android/src/main/AndroidManifest.xml');

for (const founder of ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred']) assert.match(pricing, new RegExp(founder));
assert.match(pricing, /FOUNDER_ACCESS_TIER:\s*Tier\s*=\s*'godfather'/);
assert.match(pricing, /return isFounderAccountName\(accountName\) \? FOUNDER_ACCESS_TIER : tier;/);

assert.match(storage, /:pending/);
assert.match(storage, /:last-known-good/);
assert.match(storage, /decodePersistedState/);
assert.match(storage, /recoveredFromPending/);
assert.match(storage, /recoveredFromLastKnownGood/);
assert.match(storage, /volatileStateRevision/);
assert.doesNotMatch(storage, /catch \{ return emptyState\(\); \}/);

assert.match(backup, /stripEntitlement/);
assert.match(backup, /data: stripEntitlement\(data\)/);
assert.match(backup, /return stripEntitlement\(validateBackup\(parsed\)\.data\)/);
assert.match(backup, /MAX_BACKUP_BYTES/);
assert.match(backup, /data\.accounts\.length > MAX_ACCOUNTS/);
assert.match(backup, /data\.alarms\.length > MAX_ALARMS/);

assert.match(notifications, /NOTIFICATION_REGISTRY_KEY/);
assert.match(notifications, /notificationOwnershipKey/);
assert.match(notifications, /reconcileScheduledNotifications/);
assert.match(notifications, /getVolatileStateRevision/);
assert.match(notifications, /getVolatileState/);
assert.match(notifications, /upcomingMoments\(alarm, now\)/);
assert.match(notifications, /consumeRecoverySignals/);
assert.match(notifications, /AppState\.addEventListener/);
assert.match(notifications, /Notifications\.cancelAllScheduledNotificationsAsync/);

assert.match(nativeIndex, /consumeRecoverySignals/);
assert.match(nativeModule, /consumeRecoverySignals/);
assert.match(receiver, /ACTION_BOOT_COMPLETED/);
assert.match(receiver, /ACTION_MY_PACKAGE_REPLACED/);
assert.match(receiver, /SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED/);
assert.match(receiver, /boot_reconciliation_needed/);
assert.match(receiver, /exact_alarm_permission_changed/);
assert.match(manifest, /RECEIVE_BOOT_COMPLETED/);
assert.match(manifest, /TGMRecoveryReceiver/);

console.log('P0 hardening verification: PASS');
console.log('Storage recovery, backup entitlement isolation, idempotent notification ownership and Android recovery signals are contract-protected.');
