import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const js = read('app.js');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

assert(html.includes('<link rel="stylesheet" href="styles.css">'), 'CSS stylesheet is not linked.');
assert(/<script src="app\.js(?:\?[^\"]+)?" defer><\/script>/.test(html), 'Application JavaScript is not linked.');
assert(html.includes('alarmOverlay'), 'Alarm overlay root is missing.');
assert(css.includes('.alarm-overlay'), 'Alarm overlay styles are missing.');
new Function(js);
new Function(sw);

for (const needle of [
  "const SOUNDS",
  'function unlockAudio',
  'function playSound',
  'function fireDueMoments',
  'function nextOccurrence',
  'function momentsFor',
  "repeat === 'gw5d'",
  'end-warning',
  'function validateBackup',
  'function exportBackup',
  'function importBackup',
  'localStorage',
  'AudioContext',
]) assert(js.includes(needle), `Missing local gaming behavior: ${needle}`);

for (const phrase of ['Alarmweiterleitung', 'SMS', 'Sensor-Gateway', 'Leitstellenintegration', 'Rauchmelder', 'Feuerwehr']) {
  assert(!js.includes(phrase) && !html.includes(phrase), `Out-of-scope integration text found: ${phrase}`);
}
for (const marker of ['TODO', 'FIXME', 'Lorem ipsum']) {
  assert(!new RegExp(marker, 'i').test(js + html + css), `Placeholder marker found: ${marker}`);
}

assert(sw.includes('./styles.css') && sw.includes('./app.js?v=4'), 'Offline shell does not cache the versioned application files.');
assert(sw.includes('./assets/notifications/alarm-pulse.wav'), 'Pulse sound is not cached offline.');
assert(sw.includes('./assets/notifications/alarm-siren.wav'), 'Siren sound is not cached offline.');
assert(sw.includes('./assets/notifications/alarm-chime.wav'), 'Chime sound is not cached offline.');
assert(manifest.orientation === 'landscape', 'Landscape orientation is not configured.');

for (const asset of [
  'assets/notifications/alarm-pulse.wav',
  'assets/notifications/alarm-siren.wav',
  'assets/notifications/alarm-chime.wav',
]) {
  const path = new URL(asset, root);
  assert(existsSync(path) && statSync(path).size > 44, `Gaming sound asset is missing or empty: ${asset}`);
}

console.log('TGM ALARM CENTER local web core validation: PASS');
