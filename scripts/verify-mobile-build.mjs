import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const requireValue = (condition, message) => { if (!condition) failures.push(message); };

const app = readJson('app.json').expo;
const eas = readJson('eas.json');
const pkg = readJson('package.json');

requireValue(app?.orientation === 'landscape', 'Mobile orientation must remain landscape.');
requireValue(app?.ios?.bundleIdentifier === 'com.tgm.alarmcenter', 'iOS bundle identifier mismatch.');
requireValue(app?.android?.package === 'com.tgm.alarmcenter', 'Android application ID mismatch.');
requireValue(app?.android?.permissions?.includes('POST_NOTIFICATIONS'), 'POST_NOTIFICATIONS is missing.');
requireValue(app?.android?.permissions?.includes('SCHEDULE_EXACT_ALARM'), 'SCHEDULE_EXACT_ALARM is missing.');
requireValue(app?.android?.permissions?.includes('RECEIVE_BOOT_COMPLETED'), 'RECEIVE_BOOT_COMPLETED is missing.');
requireValue(app?.plugins?.some((plugin) => plugin === 'expo-iap'), 'expo-iap config plugin is missing.');
requireValue(app?.plugins?.some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications'), 'expo-notifications config plugin is missing.');
requireValue(app?.plugins?.some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties'), 'expo-build-properties config plugin is missing.');
requireValue(eas?.build?.preview?.android?.buildType === 'apk', 'Preview Android build must produce an APK for team installation.');
requireValue(eas?.build?.production?.android?.buildType === 'app-bundle', 'Production Android build must produce an AAB.');
requireValue(eas?.build?.production?.distribution === 'store', 'Production EAS distribution must target the stores.');
requireValue(eas?.build?.preview?.distribution === 'internal', 'Preview EAS distribution must support internal team testing.');
requireValue(pkg?.scripts?.typecheck && pkg?.scripts?.lint && pkg?.scripts?.test, 'Quality-gate scripts are incomplete.');
requireValue(existsSync(resolve(root, 'index.js')), 'Expo root entrypoint is missing.');
requireValue(existsSync(resolve(root, 'App.tsx')), 'Native application entry component is missing.');
requireValue(existsSync(resolve(root, 'src/domain/alarm.ts')), 'Alarm domain engine is missing.');
requireValue(existsSync(resolve(root, 'src/native/notifications.ts')), 'Native notification adapter is missing.');
requireValue(existsSync(resolve(root, 'src/storage/store.ts')), 'Local storage adapter is missing.');
requireValue(existsSync(resolve(root, 'src/backup/backup.ts')), 'Backup/restore service is missing.');
for (const sound of ['alarm-pulse.wav', 'alarm-siren.wav', 'alarm-chime.wav']) {
  requireValue(existsSync(resolve(root, 'assets/notifications', sound)), `Notification sound is missing: ${sound}`);
}

if (failures.length) {
  console.error('Mobile build verification: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Mobile build verification: PASS');
console.log(`Version: ${app.version}`);
console.log(`Android: ${app.android.package}`);
console.log(`iOS: ${app.ios.bundleIdentifier}`);
console.log('Team build: preview APK + production AAB/iOS store build configured.');
