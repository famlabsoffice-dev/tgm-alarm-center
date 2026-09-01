import fs from 'node:fs';

const appConfig = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const expo = appConfig.expo;
const failures = [];

if (expo?.orientation !== 'landscape') failures.push('Expo orientation must remain landscape.');
if (expo?.ios?.supportsTablet !== true) failures.push('iOS tablet support must remain enabled.');

const permissions = new Set(expo?.android?.permissions ?? []);
for (const permission of ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED']) {
  if (!permissions.has(permission)) failures.push(`Missing Android permission: ${permission}`);
}

const configuredSounds = expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications')?.[1]?.sounds ?? [];
for (const sound of ['./assets/notifications/alarm-pulse.wav', './assets/notifications/alarm-siren.wav', './assets/notifications/alarm-chime.wav']) {
  if (!configuredSounds.includes(sound)) failures.push(`Missing notification sound in Expo config: ${sound}`);
  const path = new URL(`../${sound.slice(2)}`, import.meta.url);
  if (!fs.existsSync(path) || fs.statSync(path).size === 0) failures.push(`Missing or empty notification sound: ${sound}`);
}

const source = fs.readFileSync(new URL('../src/native/notifications.ts', import.meta.url), 'utf8');
if (!source.includes('scheduleLocalNotificationTest')) failures.push('Native notification test function is not wired.');
if (!source.includes('exactAlarm: false')) failures.push('Exact-alarm readiness must not be reported as verified by Expo alone.');

if (failures.length > 0) {
  console.error(['TGM ALARM CENTER native configuration validation: FAIL', ...failures.map((failure) => `- ${failure}`)].join('\n'));
  process.exit(1);
}

console.log('TGM ALARM CENTER native configuration validation: PASS');
