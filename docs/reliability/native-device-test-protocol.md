# TGM Alarm Center — Native Device Test Protocol

Stand: 05.09.2026

This protocol defines the physical-device execution procedure behind `config/native-device-matrix.json`. It is deliberately separate from deterministic/static verification: a repository check can validate implementation contracts, but it cannot manufacture evidence that a notification appeared on a real device.

## Evidence record

Each executed case must record:

`caseId`, `platform`, `osVersion`, `deviceModel`, `appBuild`, `executedAt`, `prerequisites`, `actions`, `expected`, `observed`, `result`, `evidenceReference`.

Allowed results are `PASS`, `FAIL`, and `BLOCKED`. `PASS` requires observation on the named physical device. `BLOCKED` is required when the required hardware, OS capability, permission surface, build, or test runtime is unavailable. Simulator-only observations do not satisfy physical evidence.

## Common setup

1. Install the exact test build identified by `appBuild`.
2. Record the physical device model and exact OS version.
3. Set the device timezone to `Europe/Berlin` for the DST cases unless the case explicitly tests a timezone change.
4. Ensure the app has a clean local state for `fresh-install`; preserve state for recovery cases.
5. Use a near-term test alarm with a warning moment and a main event far enough apart to visually distinguish both notifications.
6. Record notification permission state and any exact-alarm, battery, Focus, or system-management state that affects the case.
7. Capture an evidence reference pointing to the real operator record, such as a test-run entry or attached device evidence.

## Android execution protocol

### A-01 Fresh install

Prerequisites: clean uninstall or equivalent clean app data.

Actions: install; launch; initialize local state; create an alarm before granting notifications where supported.

Expected: local alarm state is usable and persisted; readiness does not claim native delivery while notification access is unavailable.

### A-02 Notification denied

Prerequisites: notifications denied.

Actions: create a near-term alarm and warning.

Expected: alarm remains persisted; readiness reports native delivery unavailable; no false successful-delivery state is shown.

### A-03 Notification granted

Prerequisites: notifications granted.

Actions: reconcile a near-term alarm with warning and main event.

Expected: both eligible moments are scheduled without duplicate ownership; observe the resulting notifications.

### A-04 Exact alarm denied / regranted

Prerequisites: Android exact-alarm access is exposed on the device.

Actions: deny access; reconcile; verify readiness; re-grant access; reconcile again.

Expected: readiness transitions with the OS state; regrant does not create duplicate notifications.

### A-05 Lockscreen delivery

Actions: schedule a near-term event; lock the device before delivery.

Expected: the notification is visible on the lock screen according to the OS notification/privacy settings, with configured sound/vibration behavior when permitted.

### A-06 Background delivery

Actions: schedule a near-term event; background the application and do not keep it foregrounded.

Expected: eligible local notification arrives without foreground execution.

### A-07 Reboot

Actions: create a future alarm; reboot the device; wait for boot completion and application recovery; reconcile.

Expected: persisted alarms survive reboot and eligible notification moments are restored deterministically. Evidence must identify the real hardware and post-reboot observation.

### A-08 Doze / battery saver

Actions: enable the device's battery-saver / Doze conditions; execute a near-term event; inspect readiness and resulting behavior.

Expected: the app does not overclaim delivery guarantees that the OS may restrict; after remediation/recovery, reconciliation is deterministic.

### A-09 Timezone change

Actions: create a future alarm; record its UTC identity; change the device timezone; relaunch/reconcile; inspect both stored event identity and displayed local time.

Expected: persisted UTC event identity remains stable; local display follows the active device timezone; no duplicate alarm ownership is created.

### A-10 DST transition

Actions: execute cases immediately before and after the Europe/Berlin spring-forward and fall-back boundaries; for recurring local-time alarms use the same recurrence definition across the transition.

Expected: local recurring behavior follows the device/IANA timezone rules; spring-forward does not fabricate a non-existent local instant; fall-back does not create an unintended duplicate occurrence; UTC event identity remains deterministic.

### A-11 Xiaomi / MIUI battery management

Device family: Xiaomi / HyperOS.

Actions: exercise the OEM battery-management restrictions against a near-term alarm; inspect native readiness; apply the required user remediation; reconcile.

Expected: readiness reflects the actual OS restriction; after remediation, managed notification scheduling is restored without duplicate ownership.

### A-12 Samsung battery management

Device family: Samsung / One UI.

Actions: exercise the OEM battery-management restrictions against a near-term alarm; inspect native readiness; apply the required user remediation; reconcile.

Expected: readiness reflects the actual OS restriction; after remediation, managed notification scheduling is restored without duplicate ownership.

## Android recovery protocol

For `process-death` and `force-stop`, terminate the application without clearing local storage, relaunch, and reconcile. Confirm alarms remain intact and that managed notifications are restored where the platform permits them. Do not treat an app relaunch alone as proof of delivery; the notification must be observed on the physical device for a `PASS` delivery case.

## iOS execution protocol

### I-01 Fresh install

Install a clean build and initialize the local store. Confirm alarms can be created before notification authorization and that the app does not falsely report native delivery readiness.

### I-02 Notification denied

Deny notification authorization; create a near-term alarm. Confirm persistence and readiness behavior.

### I-03 Notification granted

Grant authorization and reconcile. Confirm eligible local notifications are scheduled without duplicates and observe delivery.

### I-04 Lockscreen delivery

Lock the device before a near-term event. Observe visibility and configured interruption behavior subject to iOS notification/privacy settings.

### I-05 Background delivery

Background the app before delivery. Observe notification delivery without requiring foreground execution.

### I-06 App kill / relaunch

Terminate the app, relaunch, and reconcile. Confirm persisted alarms remain intact and scheduling ownership remains deterministic.

### I-07 Timezone / DST

Change timezone before a future event and execute recurring cases around Europe/Berlin DST boundaries. Confirm stored event identity remains stable while local presentation and recurrence follow device timezone rules.

## I-08 Focus mode

Run a near-term notification while Focus mode is active. Confirm scheduling state accurately reflects OS restrictions and the app never claims to bypass Focus.

## I-09 Time Sensitive

Exercise the supported Time Sensitive notification setting. Confirm capability is derived from the real authorization/settings state rather than inferred from scheduling success alone.

## Physical evidence acceptance

A case is accepted as `PASS` only when the evidence record contains a real physical device model, exact OS version, app build, execution timestamp, concrete observed result, and an evidence reference to the operator's real test record.

A static verifier may return `PASS` for the implementation contract while physical matrix execution remains incomplete. This distinction is intentional and mandatory for release integrity.
