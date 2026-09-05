# TGM ALARM CENTER — Notification Delivery Contract

## Product rule

TGM ALARM CENTER is a time-critical utility. Notification readiness must be treated as an observable state, not as an implicit guarantee.

## What the application verifies automatically

- The native notification capability is only considered supported on a real device.
- iOS authorization is evaluated from the platform-specific authorization state.
- Android notification channels are created and read back before the app reports channel readiness.
- Android exact-alarm capability is queried before time-critical scheduling.
- Active alarms are reconciled from the complete locally loaded alarm set, independent of the selected UI account.
- Scheduling is serialized and deduplicated using stable alarm ownership keys.
- Android boot, package replacement and exact-alarm permission changes raise recovery signals for the next app reconciliation.
- The device test records a positive test signal only after the native notification path reports it back to the app.

## What automated checks cannot prove

A JavaScript test, static contract, CI run or successful `scheduleNotificationAsync` call cannot prove that a future notification will be visibly delivered under every real operating-system condition.

Actual delivery can still be affected by device state, user permission changes, notification-channel state, OS policy, OEM restrictions, battery behavior, focus or interruption settings, and other platform-specific conditions.

Therefore the release gate must distinguish:

1. **Scheduling verified** — the application accepted and reconciled the notification plan.
2. **Device signal verified** — a real device reported the scheduled local test signal back to the application.
3. **Visible delivery verified** — a human tester confirmed the system notification appeared on the device.
4. **Reliability verified** — the same behavior remains correct across the supported Android/iOS device matrix, including reboot, permission changes, background/locked state and relevant time-zone/DST transitions.

Only the fourth state is sufficient for a production claim of notification reliability. The application must never display a customer-facing state that implies a guarantee beyond the evidence actually obtained.
