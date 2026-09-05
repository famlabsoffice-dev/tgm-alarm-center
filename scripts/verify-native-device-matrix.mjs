import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const readJson = (path) => JSON.parse(read(path));

const matrix = readJson('config/native-device-matrix.json');
const app = readJson('app.json').expo;
const notifications = read('src/native/notifications.ts');
const nativeModule = read('modules/tgm-exact-alarm/android/src/main/java/expo/modules/tgmalarm/TGMExactAlarmModule.kt');
const recoveryReceiver = read('modules/tgm-exact-alarm/android/src/main/java/expo/modules/tgmalarm/TGMRecoveryReceiver.kt');
const manifest = read('modules/tgm-exact-alarm/android/src/main/AndroidManifest.xml');
const protocol = read('docs/reliability/native-device-test-protocol.md');
const matrixDoc = read('docs/reliability/native-device-matrix.md');

if (matrix.schemaVersion !== 1 || !matrix.matrixVersion || matrix.physicalEvidenceRequired !== true) throw new Error('Native device matrix schema is invalid.');
if (!Array.isArray(matrix.evidenceFields) || !matrix.evidenceFields.includes('evidenceReference')) throw new Error('Device evidence contract is incomplete.');
if (JSON.stringify(matrix.allowedResults) !== JSON.stringify(['PASS', 'FAIL', 'BLOCKED'])) throw new Error('Device evidence result contract is invalid.');

const requiredAndroidSlots = new Set(['android-aosp-api36', 'android-samsung-api36', 'android-xiaomi-api36']);
const requiredAndroidCases = new Set([
  'fresh-install', 'notification-denied', 'notification-granted', 'exact-alarm-denied-regranted',
  'lockscreen-delivery', 'background-delivery', 'process-death', 'force-stop', 'reboot',
  'doze-battery-saver', 'oem-battery-restriction', 'timezone-change', 'dst-transition',
]);
const requiredIosSlots = new Set(['ios-phone-current', 'ios-tablet-current']);
const requiredIosCases = new Set([
  'fresh-install', 'notification-denied', 'notification-granted', 'lockscreen-delivery',
  'background-delivery', 'app-kill-relaunch', 'focus-mode', 'time-sensitive', 'timezone-change', 'dst-transition',
]);

function assertSet(name, actual, required) {
  const set = new Set(actual);
  for (const value of required) if (!set.has(value)) throw new Error(`${name} is missing: ${value}`);
}

assertSet('Android slots', matrix.platforms?.android?.slots?.map((slot) => slot.id) ?? [], requiredAndroidSlots);
assertSet('Android cases', matrix.platforms?.android?.cases ?? [], requiredAndroidCases);
assertSet('iOS slots', matrix.platforms?.ios?.slots?.map((slot) => slot.id) ?? [], requiredIosSlots);
assertSet('iOS cases', matrix.platforms?.ios?.cases ?? [], requiredIosCases);

for (const platform of [matrix.platforms.android, matrix.platforms.ios]) {
  if (!Array.isArray(platform.slots) || platform.slots.length === 0) throw new Error('Every platform needs physical-device slots.');
  if (!Array.isArray(platform.cases) || platform.cases.length === 0) throw new Error('Every platform needs execution cases.');
  for (const slot of platform.slots) {
    if (!slot.id || !slot.family || !Array.isArray(slot.focus) || slot.focus.length === 0) throw new Error('Device slot is incomplete.');
  }
}

if (!app.ios?.supportsTablet || !app.ios?.bundleIdentifier) throw new Error('iOS physical-device configuration is incomplete.');
for (const permission of ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED']) {
  if (!app.android?.permissions?.includes(permission)) throw new Error(`Android permission missing: ${permission}`);
}
for (const fragment of [
  'canScheduleExactAlarms',
  'isIgnoringBatteryOptimizations',
  'openBatteryOptimizationSettings',
  'consumeRecoverySignals',
]) {
  if (!nativeModule.includes(fragment)) throw new Error(`Android native readiness hook missing: ${fragment}`);
}
for (const fragment of ['ACTION_BOOT_COMPLETED', 'ACTION_MY_PACKAGE_REPLACED', 'ACTION_PACKAGE_REPLACED', 'SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED']) {
  if (!recoveryReceiver.includes(fragment) || !manifest.includes(fragment)) throw new Error(`Android recovery hook missing: ${fragment}`);
}
for (const fragment of ['lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC', 'AppState.addEventListener', 'canScheduleExactAlarms()', 'interruptionLevel: preferences.criticalAlerts ? \'timeSensitive\' : \'active\'']) {
  if (!notifications.includes(fragment)) throw new Error(`Native notification behavior missing: ${fragment}`);
}
for (const path of ['docs/reliability/native-device-test-protocol.md', 'docs/reliability/native-device-matrix.md']) {
  if (!existsSync(path)) throw new Error(`Reliability document is missing: ${path}`);
}
for (const requiredText of ['A-07 Reboot', 'A-08 Doze / battery saver', 'A-09 Timezone change', 'A-10 DST transition', 'A-11 Xiaomi / MIUI battery management', 'A-12 Samsung battery management', 'I-07 Timezone / DST']) {
  if (!protocol.includes(requiredText)) throw new Error(`Protocol coverage missing: ${requiredText}`);
}
for (const requiredText of ['Android API 36 matrix', 'iOS matrix', 'physical notification evidence', 'deterministic DST / timezone verification', 'release gate']) {
  if (!matrixDoc.toLowerCase().includes(requiredText.toLowerCase())) throw new Error(`Device matrix documentation missing: ${requiredText}`);
}

console.log('NATIVE DEVICE MATRIX CONTRACT: PASS');
console.log('Android API 36 slots, iOS slots, permission/reboot/background/lockscreen/OEM-battery coverage, and timezone/DST evidence contract verified.');
console.log('Physical-device PASS results are intentionally not synthesized by this verifier.');
