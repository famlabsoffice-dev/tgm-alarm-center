import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const app = JSON.parse(read('app.json')).expo;
const notifications = read('src/native/notifications.ts');
const nativeModule = read('modules/tgm-exact-alarm/android/src/main/java/expo/modules/tgmalarm/TGMExactAlarmModule.kt');
const moduleConfig = JSON.parse(read('modules/tgm-exact-alarm/expo-module.config.json'));
const eas = JSON.parse(read('eas.json'));
const packageJson = JSON.parse(read('package.json'));
const alarmDomain = read('src/domain/alarm.ts');

const requiredAndroidPermissions = ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED'];
for (const permission of requiredAndroidPermissions) {
  if (!app.android?.permissions?.includes(permission)) throw new Error(`Android permission missing: ${permission}`);
}

const notificationPlugin = app.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
if (!notificationPlugin) throw new Error('expo-notifications plugin configuration missing.');
const configuredSounds = notificationPlugin[1]?.sounds ?? [];
for (const sound of ['./assets/notifications/alarm_pulse.wav', './assets/notifications/alarm_siren.wav', './assets/notifications/alarm_chime.wav']) {
  if (!configuredSounds.includes(sound)) throw new Error(`Notification sound is not registered in app.json: ${sound}`);
  if (!existsSync(sound)) throw new Error(`Notification sound asset is missing: ${sound}`);
}

if (!moduleConfig.platforms.includes('android')) throw new Error('Exact-alarm module is not Android-enabled.');
if (!moduleConfig.android?.modules?.includes('expo.modules.tgmalarm.TGMExactAlarmModule')) throw new Error('Exact-alarm native module is not registered for Expo autolinking.');
for (const fragment of ['alarmManager.canScheduleExactAlarms()', 'Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM', 'PowerManager', 'Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS']) {
  if (!nativeModule.includes(fragment)) throw new Error(`Native Android capability missing: ${fragment}`);
}
for (const fragment of ['canScheduleExactAlarms()', 'exactAlarm', 'scheduleNotificationAsync', 'alarm-siren.wav', 'alarm-pulse.wav', 'alarm-chime.wav']) {
  if (!notifications.includes(fragment)) throw new Error(`Notification reliability contract missing: ${fragment}`);
}
for (const fragment of ["repeat === 'gw5d'", 'FIVE_DAYS_MS', 'occurrenceEnd', 'end-warning']) {
  if (!alarmDomain.includes(fragment)) throw new Error(`GW cycle contract missing: ${fragment}`);
}
if (eas.build?.production?.android?.buildType !== 'app-bundle') throw new Error('Production Android build is not configured as an AAB.');
if (eas.build?.preview?.android?.buildType !== 'apk' || eas.build?.preview?.distribution !== 'internal') throw new Error('Internal Android team-test APK profile is incomplete.');
if (!packageJson.scripts?.['verify:full-release']) throw new Error('Full release verification script is missing.');

console.log('ANDROID RELIABILITY CONTRACT: PASS');
console.log('Android exact-alarm permission, battery capability hooks, notification sound assets, GW cycle markers, and AAB/APK build profiles verified.');
console.log('Physical-device execution remains a hardware validation step and is not represented by static checks.');
