import { describe, expect, it } from 'vitest';
import { TEMPLATES, buildAlarm, localDateTimeToUtc, validateAlarmTiming } from '../src/domain/alarm';

describe('individual alarm timing', () => {
  it('accepts an individual start time before its own alarm time', () => {
    const startAtUtc = localDateTimeToUtc('2030-06-10', '18:15');
    const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
    expect(startAtUtc).not.toBeNull();
    expect(alarmAtUtc).not.toBeNull();
    expect(validateAlarmTiming(startAtUtc, alarmAtUtc as string)).toBe(true);
    const alarm = buildAlarm({ ...TEMPLATES.individual, startAtUtc }, 'account-1', '2030-06-10', '19:00');
    expect(alarm.startAtUtc).toBe(startAtUtc);
    expect(alarm.eventAtUtc).toBe(alarmAtUtc);
  });

  it('rejects a start time after the alarm time', () => {
    const startAtUtc = localDateTimeToUtc('2030-06-10', '19:01');
    const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
    expect(validateAlarmTiming(startAtUtc, alarmAtUtc as string)).toBe(false);
    expect(() => buildAlarm({ ...TEMPLATES.individual, startAtUtc }, 'account-1', '2030-06-10', '19:00')).toThrow('Startzeit darf nicht nach dem Alarmzeitpunkt liegen');
  });

  it('keeps legacy alarms valid when no start time exists', () => {
    const alarmAtUtc = localDateTimeToUtc('2030-06-10', '19:00');
    expect(validateAlarmTiming(undefined, alarmAtUtc as string)).toBe(true);
    const alarm = buildAlarm(TEMPLATES.individual, 'account-1', '2030-06-10', '19:00');
    expect(alarm.startAtUtc).toBeNull();
  });
});
