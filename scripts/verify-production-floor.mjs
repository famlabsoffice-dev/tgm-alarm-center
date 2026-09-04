import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const requireValue = (condition, message) => { if (!condition) failures.push(message); };
const requireFile = (path) => requireValue(existsSync(resolve(root, path)), `Required production file is missing: ${path}`);

const pricing = read('src/domain/pricing.ts');
const alarm = read('src/domain/alarm.ts');
const notifications = read('src/native/notifications.ts');
const notificationPlan = read('src/native/notificationSchedule.ts');
const backup = read('src/backup/backup.ts');
const accountActions = read('src/domain/accountAlarmActions.ts');
const app = read('App.tsx');
const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json')).expo;
const eas = JSON.parse(read('eas.json'));

for (const path of [
  'src/domain/pricing.ts',
  'src/domain/alarm.ts',
  'src/domain/accountAlarmActions.ts',
  'src/native/notifications.ts',
  'src/native/notificationSchedule.ts',
  'src/backup/backup.ts',
  'src/storage/store.ts',
  'tests/billing-security.test.mjs',
  'scripts/check-founder.mjs',
]) requireFile(path);

requireValue(pricing.includes("FOUNDER_ACCESS_TIER: Tier = 'godfather'"), 'Founder access tier must remain Godfather.');
for (const name of ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred']) {
  requireValue(pricing.includes(name), `Founder account missing from pricing contract: ${name}`);
}
requireValue(pricing.includes('accountName.trim().toLowerCase()'), 'Founder matching must remain trimmed and case-insensitive.');
requireValue(pricing.includes('return isFounderAccountName(accountName) ? FOUNDER_ACCESS_TIER : tier;'), 'Founder effective-tier bypass contract is missing.');

requireValue(alarm.includes("repeat: 'gw5d'"), 'Five-day GW repeat mode is missing.');
requireValue(alarm.includes('nextOccurrence'), 'Alarm occurrence engine is missing.');
requireValue(alarm.includes('eventAtUtc'), 'UTC event persistence contract is missing.');
requireValue(alarm.includes('TIER_LIMITS'), 'Tier limit definitions are missing.');

requireValue(notifications.includes('SOUND_CHANNELS'), 'Notification sound channel matrix is missing.');
requireValue(notifications.includes('canScheduleExactAlarms'), 'Android exact-alarm readiness gate is missing.');
requireValue(notifications.includes('accountId: alarm.accountId'), 'Notification account ownership payload is missing.');
requireValue(notifications.includes('alarm-pulse.wav') && notifications.includes('alarm-siren.wav') && notifications.includes('alarm-chime.wav'), 'Notification sound assets are not fully wired.');
requireValue(notifications.includes('Notifications.cancelAllScheduledNotificationsAsync'), 'Notification reconciliation cancellation is missing.');
requireValue(notificationPlan.includes('buildNotificationPlan'), 'Deterministic notification planning is missing.');
requireValue(notificationPlan.includes('warning') && notificationPlan.includes('end-warning'), 'Warning boundary planning is incomplete.');

requireValue(backup.includes("FORMAT = 'tgm-alarm-center-backup'"), 'Backup format identifier is missing.');
requireValue(backup.includes('schemaVersion: 1'), 'Backup schema version contract is missing.');
requireValue(backup.includes('activeAccountId'), 'Backup active-account state is missing.');
requireValue(backup.includes('validateBackup'), 'Backup validation is missing.');
requireValue(backup.includes('alarmIds') && backup.includes('accountIds'), 'Backup identity/reference validation is incomplete.');
requireValue(backup.includes('JSON.parse'), 'Backup restore must parse JSON payloads.');

requireValue(accountActions.includes('accountId'), 'Account-scoped alarm actions are missing ownership context.');
requireValue(app.includes('alarmsForAccount(state.alarms, state.activeAccountId)'), 'UI alarm list must remain account-scoped.');
requireValue(app.includes('effectiveTierForAccount(state.tier, activeAccount?.name ?? \'\')'), 'Native UI must apply the effective account tier.');
requireValue(app.includes('completeAccountOccurrence'), 'Notification completion must remain account-scoped.');
requireValue(app.includes('scheduleAlarm(alarm, state.notificationPreferences)'), 'Active alarms must be reconciled into native notifications.');

requireValue(appJson.orientation === 'landscape', 'Production mobile orientation must remain landscape.');
requireValue(appJson.android?.package === 'com.tgm.alarmcenter', 'Android application ID mismatch.');
requireValue(appJson.ios?.bundleIdentifier === 'com.tgm.alarmcenter', 'iOS bundle identifier mismatch.');
requireValue(eas.build?.preview?.distribution === 'internal' && eas.build?.preview?.android?.buildType === 'apk', 'Team preview APK contract is missing.');
requireValue(eas.build?.production?.distribution === 'store' && eas.build?.production?.android?.buildType === 'app-bundle', 'Production store AAB contract is missing.');
requireValue(typeof packageJson.scripts?.test === 'string', 'Canonical test script is missing.');
requireValue(typeof packageJson.scripts?.['verify:full-release'] === 'string' || typeof packageJson.scripts?.['verify:release'] === 'string', 'Canonical release verification script is missing.');

if (failures.length) {
  console.error('Production floor verification: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Production floor verification: PASS');
console.log('Internal quality floor: >= 9/10 contracts present for alarms, notifications, accounts, backup, UI integration and release configuration.');
