import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync('App.tsx', 'utf8');
const alarmCard = fs.readFileSync('src/ui/screens/AlarmCard.tsx', 'utf8');
const editor = fs.readFileSync('src/ui/screens/AlarmEditorModal.tsx', 'utf8');
const settings = fs.readFileSync('src/ui/screens/SettingsScreen.tsx', 'utf8');
const screen = fs.readFileSync('src/ui/screens/CommandCenterScreen.tsx', 'utf8');
const ui = [app, alarmCard, editor, settings, screen].join('\n');

test('dashboard keeps Next Critical Event as the primary command-center answer', () => {
  assert.match(app, /<Text[^>]*style=\{styles\.eyebrow\}>ALS NÄCHSTES<\/Text>/u);
  assert.match(app, /style=\{styles\.nextTitle\}>\{next\.alarm\.title\}/u);
  assert.match(app, /formatCountdown\(next\.event, now\)/u);
});

test('dashboard exposes account, warning schedule and notification readiness', () => {
  assert.match(app, /activeAccount\?\.name \?\?/u);
  assert.match(alarmCard, /upcomingMoments\(alarm, new Date\(now\)\)/u);
  assert.match(app, /readinessText\(readiness\)/u);
  assert.match(app, /NOTIFICATIONS/u);
});

test('critical interactive controls retain accessible button semantics and labels', () => {
  const buttonCount = (ui.match(/accessibilityRole="button"/gu) ?? []).length;
  assert.ok(buttonCount >= 8, `expected at least 8 accessible buttons, found ${buttonCount}`);
  assert.match(alarmCard, /accessibilityLabel=\{`\$\{alarm\.title\} bearbeiten`\}/u);
  assert.match(alarmCard, /accessibilityLabel=\{`\$\{alarm\.title\} löschen`\}/u);
  assert.match(app, /accessibilityLabel=\{`\$\{TEMPLATES\[key\]\.title\} erstellen`\}/u);
});

test('interactive controls expose accessible names and minimum touch targets', () => {
  assert.match(editor, /accessibilityLabel="Alarmbezeichnung"/u);
  assert.match(editor, /accessibilityLabel="Alarmdatum"/u);
  assert.match(editor, /accessibilityLabel="Alarmuhrzeit"/u);
  assert.match(settings, /accessibilityLabel="Backup exportieren"/u);
  assert.match(settings, /accessibilityLabel="Backup importieren"/u);
  assert.match(settings, /accessibilityLabel="Gerätetest starten"/u);
  assert.match(editor, /closeButton: \{ width: 44, height: 44,/u);
  assert.match(app, /templateCard:[^\n]*minHeight: 48/u);
  assert.match(editor, /choice:[^\n]*minHeight: 44/u);
  assert.match(alarmCard, /secondaryButton:[^\n]*minHeight: 44/u);
  assert.match(editor, /primaryButton:[^\n]*minHeight: 48/u);
});

test('customer-facing dashboard contains no engineering audit marker', () => {
  assert.doesNotMatch(app, /audit metadata|internal diagnostic|engineering metadata/iu);
});
