# TGM ALARM CENTER — NEXT WORK PLAN

## Product direction

The product is treated as the foundation of a broader **TGM Command Center**, not merely an alarm app. The current release remains focused: reliability and trust come before feature expansion.

Potential future Command Center domains, intentionally deferred until the reliability gate is complete:
- Event scheduling
- Faction coordination
- Multiple accounts
- Battle timelines
- Team/group planning
- Event history
- Intelligent presets
- Statistics
- Synchronized team data

## Mandatory execution order

**Reliability → Account Isolation → Notification Reliability → Regression → UX Polish → Monetization → Release**

No feature expansion may outrank an unresolved reliability, isolation, notification, regression, or release-blocking defect.

---

## Internal execution checkpoint — 2026-09-05

The reusable UI screen architecture pass is complete in `main`: the command-center shell, alarm card, alarm editor and settings surface are extracted as real production components, while domain state, scheduler reconciliation, entitlement logic, account isolation and founder access remain in their existing application contracts. The extraction is covered by a deterministic repository workflow with typecheck and lint validation. This checkpoint does not replace the mandatory reliability, isolation, notification, regression, monetization or release gates below.

---

## 1. RELIABILITY — absolute time and lifecycle correctness

### Objective
Guarantee that every alarm represents the intended absolute point in time and survives the complete local application lifecycle.

### Work
- Keep all scheduling calculations anchored to absolute timestamps/UTC semantics.
- Verify Bubble warnings at 60 and 15 minutes plus mandatory end warning.
- Verify GW Bubble warnings at 60, 30 and 15 minutes plus mandatory end warning.
- Verify Custom Event warning at 15 minutes plus mandatory end warning.
- Verify GW 5-day cycle calculation and 24-hour protection window.
- Verify remaining protection time and next-cycle calculation.
- Verify persistence → restart → reload → rescheduling.
- Verify behavior across timezone changes.
- Verify DST transitions and timezone-invariant calculations.
- Verify past/expired alarms cannot be resurrected incorrectly.
- Verify edits, duplication, deletion, pause/reactivation and account lifecycle trigger correct scheduler reconciliation.
- Ensure repeated rescheduling is idempotent and does not create duplicate active jobs.

### Gate
No known lifecycle or timestamp defect; deterministic tests cover all notification moments and boundary cases.

---

## 2. ACCOUNT ISOLATION — hard security boundary in local state

### Objective
An active account may only display and mutate its own account-scoped alarms/events/settings. Account switching must never leak another account's UI state.

### Required scope
- Persist account ownership on every account-scoped entity.
- Filter reads by the active account before rendering.
- Filter writes/mutations by the active account.
- Clear/reconcile account-scoped UI state on account switch.
- Cancel/reschedule account-scoped scheduler state correctly on switch.
- Restore backups without cross-account contamination.
- Ensure deletion/duplication/editing cannot target another account.
- Ensure active countdown/detail views cannot retain stale data after switching.
- Ensure browser reload restores only the selected account's visible data.
- Ensure founder/tier entitlements remain independent from alarm ownership.
- Keep global notification scheduling independent where required: switching the visible account must not silently cancel legitimate alarms belonging to another configured account.

### Explicit invariant
**No alarm belonging to Account B may be visible as an alarm of Account A. No Account A mutation may modify Account B data.**

### Gate
Dedicated account-isolation tests pass for UI, persistence, scheduler continuity, restore, reload and account switching.

---

## 3. NOTIFICATION RELIABILITY — delivery is a product-critical function

### Objective
Ensure scheduled notifications remain correct and actionable on supported environments.

### Work
- Verify notification permission handling.
- Verify exact-alarm capability handling on native Android where applicable.
- Verify time-critical notification channel behavior.
- Verify each alarm type maps to the correct local tone.
- Verify notification payload/title/body identifies the correct alarm/event without exposing another account's data in the active UI.
- Verify rescheduling after restart and relevant lifecycle changes.
- Verify duplicate-notification prevention.
- Verify cancellation after deletion/pause.
- Verify reactivation schedules exactly the intended future moments.
- Verify expired moments are not scheduled retroactively.
- Verify all global notification moments remain complete after account switching.

### Gate
Every supported alarm moment has one deterministic scheduling path and corresponding automated coverage; no known duplicate, stale, missing, or cross-account notification path remains.

---

## 4. REGRESSION — protect every already-working contract

### Objective
Turn the current reliability fixes into permanent product contracts.

### Work
- Keep deterministic timezone-invariance tests.
- Keep complete global notification-moment assertions.
- Keep account UI isolation tests.
- Keep notification/account-selection independence tests.
- Keep typecheck/lint/syntax validation.
- Keep web-core verification.
- Run the full test suite after each reliability change.
- Add regression tests for every discovered production/test failure before closing it.
- Test backup/restore against account ownership and scheduler reconstruction.
- Test cold start and reload from persisted state.
- Test multiple alarms at identical and adjacent moments.
- Test boundary conditions around zero/negative remaining time.

### Gate
Full automated suite passes with no environment-dependent assertions and no known regression.
