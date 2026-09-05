import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync('App.tsx', 'utf8');

test('dashboard keeps Next Critical Event as the primary command-center answer', () => {
  assert.match(app, /<Text[^>]*style=\{styles\.eyebrow\}>ALS NÄCHSTES<\/Text>/u);
  assert.match(app, /<Text[^>]*style=\{styles\.nextTitle\}>\{next\?\.alarm\.title\}/u);
  assert.match(app, /formatCountdown\(next\.event, now\)/u);
});

test('dashboard exposes account, warning schedule and notification readiness', () => {
  assert.match(app, /activeAccount\?\.name \?\?/u);
  assert.match(app, /upcomingMoments\(item, new Date\(now\)\)/u);
  assert.match(app, /readinessText\(readiness\)/u);
  assert.match(app, /NOTIFICATIONS/u);
});

test('critical interactive controls retain accessible button semantics and labels', () => {
  const buttonCount = (app.match(/accessibilityRole="button"/gu) ?? []).length;
  assert.ok(buttonCount >= 8, `expected at least 8 accessible buttons, found ${buttonCount}`);
  assert.match(app, /accessibilityLabel=\{`\$\{item\.title\} bearbeiten`\}/u);
  assert.match(app, /accessibilityLabel=\{`\$\{item\.title\} löschen`\}/u);
  assert.match(app, /accessibilityLabel=\{`\$\{TEMPLATES\[key\]\.title\} erstellen`\}/u);
});

test('customer-facing dashboard contains no engineering audit marker', () => {
  assert.doesNotMatch(app, /audit metadata|internal diagnostic|engineering metadata/iu);
});
