import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localDateTimeToUtc, localInputFromUtc, occurrenceEnd, nextOccurrence, type Alarm } from '../src/domain/alarm';

const matrix = JSON.parse(readFileSync('config/native-device-matrix.json', 'utf8')) as {
  platforms: {
    android: { slots: { id: string }[]; cases: string[] };
    ios: { slots: { id: string }[]; cases: string[] };
  };
  evidenceFields: string[];
  allowedResults: string[];
};

function alarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'matrix-test',
    accountId: 'account-1',
    title: 'Matrix Test',
    type: 'custom',
    date: '2030-01-01',
    time: '12:00',
    eventAtUtc: '2030-01-01T12:00:00.000Z',
    warnings: [],
    repeat: 'once',
    sound: 'pulse',
    active: true,
    protected: false,
    completedOccurrences: {},
    createdAt: '2029-01-01T00:00:00.000Z',
    updatedAt: '2029-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('native device matrix contains all required physical slots and cases', () => {
  assert.deepEqual(
    new Set(matrix.platforms.android.slots.map((slot) => slot.id)),
    new Set(['android-aosp-api36', 'android-samsung-api36', 'android-xiaomi-api36']),
  );
  assert.deepEqual(
    new Set(matrix.platforms.ios.slots.map((slot) => slot.id)),
    new Set(['ios-phone-current', 'ios-tablet-current']),
  );
  for (const caseId of ['reboot', 'lockscreen-delivery', 'background-delivery', 'doze-battery-saver', 'oem-battery-restriction', 'timezone-change', 'dst-transition']) {
    assert.ok(matrix.platforms.android.cases.includes(caseId), `Android case missing: ${caseId}`);
  }
  for (const caseId of ['lockscreen-delivery', 'background-delivery', 'focus-mode', 'time-sensitive', 'timezone-change', 'dst-transition']) {
    assert.ok(matrix.platforms.ios.cases.includes(caseId), `iOS case missing: ${caseId}`);
  }
  assert.deepEqual(matrix.allowedResults, ['PASS', 'FAIL', 'BLOCKED']);
  assert.ok(matrix.evidenceFields.includes('deviceModel'));
  assert.ok(matrix.evidenceFields.includes('evidenceReference'));
});

test('Europe/Berlin spring-forward rejects a nonexistent local time', () => {
  const previousTz = process.env.TZ;
  process.env.TZ = 'Europe/Berlin';
  try {
    assert.equal(localDateTimeToUtc('2026-03-29', '02:30'), null);
    assert.equal(localDateTimeToUtc('2026-03-29', '01:30'), '2026-03-29T00:30:00.000Z');
    assert.equal(localDateTimeToUtc('2026-03-29', '03:30'), '2026-03-29T01:30:00.000Z');
  } finally {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  }
});

test('UTC identity is preserved when the display timezone changes', () => {
  const utc = '2026-10-25T01:30:00.000Z';
  const previousTz = process.env.TZ;
  try {
    process.env.TZ = 'Europe/Berlin';
    assert.deepEqual(localInputFromUtc(utc), { date: '2026-10-25', time: '02:30' });
    process.env.TZ = 'UTC';
    assert.deepEqual(localInputFromUtc(utc), { date: '2026-10-25', time: '01:30' });
  } finally {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  }
});

test('daily recurrence and five-day GW recurrence keep their distinct timezone contracts', () => {
  const previousTz = process.env.TZ;
  process.env.TZ = 'Europe/Berlin';
  try {
    const daily = alarm({ repeat: 'daily', date: '2026-10-25', time: '09:00', eventAtUtc: '2026-10-25T08:00:00.000Z' });
    const dailyNext = nextOccurrence(daily, new Date('2026-10-24T08:00:00.000Z'));
    assert.ok(dailyNext);
    assert.equal(dailyNext?.getHours(), 9);

    const gw = alarm({ repeat: 'gw5d', eventAtUtc: '2026-10-25T08:00:00.000Z' });
    const gwNext = nextOccurrence(gw, new Date('2026-10-25T09:00:00.000Z'));
    assert.equal(gwNext?.toISOString(), '2026-10-30T08:00:00.000Z');
    assert.equal(occurrenceEnd(gw, gwNext as Date)?.toISOString(), '2026-10-31T08:00:00.000Z');
  } finally {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  }
});
