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

The native scheduler consumes this plan while retaining account-scoped payload metadata. Android now uses dedicated sound channels for Pulse, Siren and Chime so the selected alarm tone is actually owned by the OS notification channel. A versioned channel namespace prevents an already-created legacy channel from silently overriding the selected sound. A dedicated silent channel is used only when the corresponding sound preference is disabled.

Scheduled alarms are device-owned OS notifications: changing the selected account does not remove another account's scheduled alarms, leaving the app does not require the JavaScript runtime to be alive at delivery time, and notification payloads retain the originating `accountId` so opening/completing an alarm remains account-safe.

## Regression coverage

Automated contracts cover:

- future-only scheduling;
- account ownership preservation;
- duplicate elimination;
- global multi-account scheduling without selected-account filtering;
- exclusion of inactive alarms;
- per-moment warning/event sound preferences.

Existing reliability, account-isolation and notification-ownership tests remain part of the full suite.

## Tester build contract

The tester APK is built from this same native notification implementation. The tester must therefore verify scheduled delivery after switching accounts and after leaving the app, with the configured Pulse/Siren/Chime tone audible at delivery time.

## Exact alarm capability

The Android `SCHEDULE_EXACT_ALARM` permission remains declared in the native app configuration. The current Expo notification API does not expose the Android app-op state as a runtime boolean, so the client does not falsely claim that the exact-alarm capability has been verified. Physical-device validation remains an external release gate.

## External validation still required

A real signed Android build must still be tested on supported physical devices for notification permission, exact-alarm behavior, lock-screen/background delivery, reboot behavior, battery optimization behavior and actual sound playback. These checks cannot be honestly marked PASS from repository-only infrastructure.

## Gate status

**Repository notification-planning gate: PASS-ready.**

**Physical-device notification-delivery gate: EXTERNAL / OPEN.**
