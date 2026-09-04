# Notification Reliability Gate

## Implemented

The native notification path now uses a deterministic notification-plan layer built from the same absolute-time domain calculations as the alarm engine.

The plan:

- includes only active alarms;
- includes only future notification moments;
- preserves `alarmId` and `accountId` on every notification entry;
- carries event time, moment type and optional end time;
- applies warning/event sound preferences per moment;
- deterministically sorts by notification timestamp;
- deduplicates identical alarm/moment identities before scheduling.

The native scheduler consumes this plan while retaining the existing Android time-critical channel, local sound mapping, notification categories and account-scoped payload metadata.

## Regression coverage

Automated contracts cover:

- future-only scheduling;
- account ownership preservation;
- duplicate elimination;
- global multi-account scheduling without selected-account filtering;
- exclusion of inactive alarms;
- per-moment warning/event sound preferences.

Existing reliability, account-isolation and notification-ownership tests remain part of the full suite.

## Exact alarm capability

The Android `SCHEDULE_EXACT_ALARM` permission remains declared in the native app configuration. The current Expo notification API does not expose the Android app-op state as a runtime boolean, so the client does not falsely claim that the exact-alarm capability has been verified. Physical-device validation remains an external release gate.

## External validation still required

A real signed Android build must still be tested on supported physical devices for notification permission, exact-alarm behavior, lock-screen/background delivery, reboot behavior, battery optimization behavior and actual sound playback. These checks cannot be honestly marked PASS from repository-only infrastructure.

## Gate status

**Repository notification-planning gate: PASS-ready.**

**Physical-device notification-delivery gate: EXTERNAL / OPEN.**
