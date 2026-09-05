import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const notifications = read('src/native/notifications.ts');
const app = read('App.tsx');
const manifest = read('app.json');

assert.match(notifications, /status\.ios\?\.status/);
assert.match(notifications, /IosAuthorizationStatus\.AUTHORIZED/);
assert.match(notifications, /IosAuthorizationStatus\.PROVISIONAL/);
assert.match(notifications, /IosAuthorizationStatus\.EPHEMERAL/);
assert.match(notifications, /canScheduleExactAlarms\(\)/);
assert.match(notifications, /categoryIdentifier: 'tgm-test'/);
assert.match(notifications, /testToken:/);
assert.match(notifications, /setNotificationCategoryAsync\('tgm-test'/);
assert.match(notifications, /Der lokale Gerätetest ist nur auf einem echten Android- oder iOS-Gerät verfügbar/);
assert.match(manifest, /SCHEDULE_EXACT_ALARM/);
assert.match(manifest, /RECEIVE_BOOT_COMPLETED/);

assert.match(app, /Platform\.OS === 'android' && !readiness\.exactAlarm/);
assert.match(app, /Exakte Alarme freigeben/);
assert.match(app, /Notification-Test geplant/);
assert.match(app, /positive Bestätigung erfolgt erst, wenn das Gerät das Signal tatsächlich meldet/);
assert.match(app, /data\.kind === 'local-test'/);
assert.match(app, /getLastNotificationResponseAsync\(\)/);
assert.match(app, /Gerätetest-Signal empfangen/);
assert.doesNotMatch(app, /Benachrichtigung erfolgreich ausgelöst/);

console.log('Native notification trust-boundary verification: PASS');
console.log('Permission state, exact-alarm gating, test identity and explicit device-signal confirmation are contract-protected.');
console.log('Automated checks do not claim guaranteed OS-level delivery.');
