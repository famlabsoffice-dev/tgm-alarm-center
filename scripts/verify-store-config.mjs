import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const configPath = resolve(root, 'app.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const expo = config.expo;
const failures = [];
const requireValue = (condition, message) => { if (!condition) failures.push(message); };

requireValue(expo?.name === 'TGM ALARM CENTER', 'Expo app name is not configured.');
requireValue(expo?.version && /^\d+\.\d+\.\d+$/.test(expo.version), 'Expo version must be a semantic release version.');
requireValue(expo?.android?.package === 'com.tgm.alarmcenter', 'Android application ID mismatch.');
requireValue(expo?.ios?.bundleIdentifier === 'com.tgm.alarmcenter', 'iOS bundle identifier mismatch.');
requireValue(expo?.android?.permissions?.includes('POST_NOTIFICATIONS'), 'POST_NOTIFICATIONS permission is missing.');
requireValue(expo?.android?.permissions?.includes('SCHEDULE_EXACT_ALARM'), 'SCHEDULE_EXACT_ALARM permission is missing.');
requireValue(expo?.plugins?.some((plugin) => plugin === 'expo-iap'), 'expo-iap config plugin is missing.');
const buildProperties = expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties')?.[1];
requireValue(buildProperties?.android?.compileSdkVersion === 36, 'Android compile SDK must be 36.');
requireValue(buildProperties?.android?.targetSdkVersion === 36, 'Android target SDK must be 36.');
requireValue(buildProperties?.android?.buildToolsVersion === '36.0.0', 'Android build tools must be 36.0.0.');
requireValue(existsSync(resolve(root, expo.icon)), 'Configured app icon does not exist.');
const sounds = expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications')?.[1]?.sounds ?? [];
for (const sound of sounds) requireValue(existsSync(resolve(root, sound)), `Configured notification sound does not exist: ${sound}`);

if (failures.length > 0) {
  console.error('Store configuration verification: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Store configuration verification: PASS');
console.log(`Android target API: ${buildProperties.android.targetSdkVersion}`);
console.log(`Application IDs: ${expo.android.package} / ${expo.ios.bundleIdentifier}`);
console.log(`Configured notification sounds: ${sounds.length}`);
