# TGM Alarm Center — Native Reliability Test Protocol

Stand: 05.09.2026
Scope: deterministic native verification preparation only

## Evidence rule

This protocol defines what must be tested on real hardware. CI, web-shell execution, static inspection, and build success MUST NOT be recorded as device evidence. Every executed case records platform, OS version, device model, app build identifier, test timestamp, prerequisites, actions, expected result, observed result, and PASS/FAIL.

## Android API 36 protocol

### A-01 Fresh install
Prerequisite: device is not running a previous TGM Alarm Center installation.
Action: install the exact candidate build and launch it.
Expected: application starts without crash, creates the local state, and remains usable before notification permissions are granted.

### A-02 Notification permission denied
Action: deny notification permission during first-run permission flow; create one near-term alarm.
Expected: app remains usable; notification readiness reports the missing permission; no false claim of scheduled native delivery is shown.

### A-03 Notification permission granted
Action: grant notification permission; create a near-term alarm with one warning and one main event.
Expected: notification readiness becomes eligible and both configured notification moments are scheduled through the single reconciliation path.

### A-04 Exact-alarm permission denied and re-granted
Action: deny exact-alarm capability where the Android build exposes it; verify readiness; re-grant it; reconcile the same alarm set.
Expected: denied state is visible as not ready; re-grant restores scheduling eligibility without duplicated notification ownership.

### A-05 Process death
Action: create near-term alarms; terminate the application process without deleting local storage; relaunch.
Expected: alarms and notification state reconcile deterministically from persisted state; no duplicate notifications are created.

### A-06 Force-stop
Action: create near-term alarms; force-stop the app; relaunch and reconcile.
Expected: persisted alarms survive; readiness reflects platform constraints; reconciliation restores the managed schedule without duplicate registry entries.

### A-07 Reboot
Action: create near-term alarms; reboot the device; launch the app after boot.
Expected: persisted state survives; notification reconciliation restores all eligible near-term moments inside the rolling scheduling window.

### A-08 Doze / battery saver
Action: repeat a near-term alarm test while Doze or battery saver is active.
Expected: app exposes any platform restriction without claiming guaranteed delivery; eligible notifications remain correctly represented after recovery.

### A-09 Timezone change
Action: create a future alarm; change the device timezone before the event; reopen and reconcile.
Expected: UTC event identity remains stable and the displayed local date/time reflects the new timezone according to the product's UTC-to-local contract.

### A-10 DST transition
Action: execute a schedule spanning the relevant Europe/Berlin DST boundary using a controlled test date.
Expected: local recurring schedule follows the IANA timezone rules and no duplicate or skipped occurrence is introduced beyond the platform's defined DST semantics.

### A-11 Xiaomi / MIUI battery management
Action: repeat A-03, A-07 and A-08 on a supported Xiaomi/MIUI device with battery restrictions exercised.
Expected: readiness accurately reflects restrictions; recovery after user remediation restores deterministic reconciliation.

### A-12 Samsung battery management
Action: repeat A-03, A-07 and A-08 on a supported Samsung device with battery optimization exercised.
Expected: same contract as A-11; no platform-specific false-positive readiness state.

## iOS protocol

### I-01 Fresh install
Action: install the exact candidate build and launch.
Expected: application starts without crash and local state is initialized.

### I-02 Notification permission denied
Action: deny notifications; create a near-term alarm.
Expected: readiness clearly remains unavailable for native delivery and the alarm itself remains persisted.

### I-03 Notification permission granted
Action: grant notifications and reconcile the same alarm set.
Expected: eligible local notifications are scheduled without duplicates.

### I-04 Focus / interruption controls
Action: run near-term warning and event cases while a Focus mode is active.
Expected: the app does not misreport platform interruption behavior as scheduling failure; user-visible readiness remains accurate.

### I-05 Time Sensitive notifications
Action: enable the product's supported critical/time-sensitive notification capability where available; schedule a near-term event.
Expected: configuration is respected and no permission state is inferred when the OS does not grant the capability.

### I-06 App kill / relaunch
Action: create near-term alarms, terminate the app, relaunch, and reconcile.
Expected: persisted state and scheduled ownership remain deterministic.

### I-07 Timezone / DST
Action: repeat the timezone and DST cases using a Europe/Berlin baseline and a DST boundary.
Expected: UTC event identity remains stable while local presentation and recurring calculations follow the device timezone rules.

### I-08 Purchase / restore evidence boundary
Action: use only a real approved test-store purchase/restore environment for this case.
Expected: purchase and restore outcomes are recorded from the native store runtime; local-only builds do not claim purchase evidence.

## Result record

Each case must be recorded as one immutable evidence row with:

`caseId`, `platform`, `osVersion`, `deviceModel`, `appBuild`, `executedAt`, `prerequisites`, `actions`, `expected`, `observed`, `result`, `evidenceReference`.

Allowed `result` values are `PASS`, `FAIL`, or `BLOCKED`. `BLOCKED` is mandatory when the required physical device, OS capability, or store runtime is unavailable. No CI run may be substituted for a physical-device result.
