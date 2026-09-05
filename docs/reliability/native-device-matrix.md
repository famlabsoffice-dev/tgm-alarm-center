# TGM Alarm Center — Native Android/iOS Device Matrix

Stand: 05.09.2026  
Matrix contract: `config/native-device-matrix.json`  
Scope: real-device delivery and recovery validation for local notifications.

## Evidence boundary

This matrix is an execution contract, not synthetic evidence. A case is `PASS` only after it is observed on the named physical device. CI, static checks, Expo web, simulator-only execution, or build success cannot replace physical notification evidence.

Every executed case records exactly these fields:

`caseId`, `platform`, `osVersion`, `deviceModel`, `appBuild`, `executedAt`, `prerequisites`, `actions`, `expected`, `observed`, `result`, `evidenceReference`.

Allowed results: `PASS`, `FAIL`, `BLOCKED`. Use `BLOCKED` when the required physical device, OS capability, or store runtime is unavailable.

## Android API 36 matrix

| Slot | Device family | Required coverage |
|---|---|---|
| `android-aosp-api36` | AOSP / Pixel-class | permission, lock screen, background, process death, force-stop, reboot, Doze/battery saver, timezone, DST |
| `android-samsung-api36` | Samsung / One UI | permission, lock screen, background, process death, force-stop, reboot, OEM battery management, timezone, DST |
| `android-xiaomi-api36` | Xiaomi / HyperOS | permission, lock screen, background, process death, force-stop, reboot, OEM battery management, timezone, DST |

Required cases:

`fresh-install` — clean install and first launch; local state is usable before notification permission is granted.

`notification-denied` — deny notification permission; create a near-term alarm; readiness must report native delivery as unavailable without losing the persisted alarm.

`notification-granted` — grant notification permission; create near-term warning and main event; both moments are scheduled through reconciliation without duplicate ownership.

`exact-alarm-denied-regranted` — deny exact-alarm access where exposed; readiness becomes unavailable; re-grant and reconcile; no duplicated notifications appear.

`lockscreen-delivery` — lock the device before a near-term event; visible notification and configured sound/vibration behavior are observed according to OS settings.

`background-delivery` — background the application before a near-term event; notification appears without requiring the app to remain foregrounded.

`process-death` — terminate the app process without deleting local storage; relaunch and reconcile; persisted alarms and notification ownership remain deterministic.

`force-stop` — force-stop the application; relaunch and reconcile; persisted alarms survive and managed notifications are restored where the platform permits.

`reboot` — reboot with future alarms present; after boot and application recovery, eligible notification moments are reconciled from persisted state.

`doze-battery-saver` — exercise Doze/battery saver during a near-term case; readiness does not overclaim delivery guarantees and recovery remains deterministic.

`oem-battery-restriction` — exercise OEM battery management on Samsung and Xiaomi; after user remediation, reconciliation restores the managed schedule and readiness reflects the OS state.

`timezone-change` — create a future alarm, change the device timezone before delivery, relaunch/reconcile; the persisted UTC event identity remains stable while local presentation follows the device timezone.

`dst-transition` — execute alarms around the Europe/Berlin DST boundaries; recurring local-time behavior follows IANA timezone rules and no duplicate occurrence is created by the product scheduler.

## iOS matrix

| Slot | Device family | Required coverage |
|---|---|---|
| `ios-phone-current` | current supported iPhone | permission, lock screen, background, app kill/relaunch, Focus, Time Sensitive, timezone, DST |
| `ios-tablet-current` | current supported iPad | permission, lock screen, background, app kill/relaunch, Focus, Time Sensitive, timezone, DST |

Required cases:

`fresh-install` — clean install and first launch; local state initializes successfully.

`notification-denied` — deny notification permission; alarms remain persisted and readiness does not claim native delivery.

`notification-granted` — grant notification permission and reconcile; eligible local notifications are scheduled without duplicates.

`lockscreen-delivery` — lock the device before a near-term event; observe notification visibility and configured interruption behavior.

`background-delivery` — move the app to background before delivery; observe local notification delivery without foreground execution.

`app-kill-relaunch` — terminate the app, relaunch, and reconcile; persisted alarms remain intact.

`focus-mode` — run near-term cases under an active Focus mode; scheduling state remains accurate without claiming the OS will override Focus.

`time-sensitive` — exercise the supported Time Sensitive setting; the app must not infer capability merely from scheduling success.

`timezone-change` — change timezone before a future event; UTC identity stays stable and display follows the device timezone.

`dst-transition` — execute cases around Europe/Berlin DST boundaries; recurring local-time behavior follows the device timezone rules.

## Deterministic DST / timezone verification

The repository also validates the domain scheduler in isolated timezone processes. This verifies the pure scheduling contract for:

- Europe/Berlin before and after the spring-forward transition.
- Europe/Berlin before and after the fall-back transition.
- UTC identity preservation when the display timezone changes.
- Daily recurrence calculated from the stored local date/time representation.
- Five-day GW recurrence based on the stored UTC event identity.

A deterministic suite result is necessary but is never sufficient to mark a physical notification-delivery case as `PASS`.

## Release gate

The repository gate is split into two explicit conditions:

1. **Implementation gate:** configuration, native recovery hooks, scheduler behavior, matrix completeness, and deterministic timezone/DST tests pass.
2. **Physical evidence gate:** every required slot/case has an evidence row with a real device model and a `PASS` result, or the release is kept out of a claim of verified native delivery.

No generated evidence file is accepted as physical proof merely because it contains `PASS` values; the evidence reference must point to the real execution record maintained by the test operator.
