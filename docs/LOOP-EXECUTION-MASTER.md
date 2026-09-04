# TGM Alarm Center — Autonomous Loop Execution Master

Stand: 05.09.2026
Basis: `main` at `d836191d44ac3677a81c6002cc017a957d23f3f8`
Arbeitsbranch: `loop/p0-internal-hardening`

## Permanent constraints

- `TGM-ALARM-CENTER-COMPLETE.zip` is excluded from all work.
- Repository state is the sole source of truth.
- Founder/Team test bypass remains enabled for exactly: `TGMack`, `TGMkellz`, `TGMj9`, `TGMvany`, `TGMred`.
- Founder/Team bypass must remain functional through all internal hardening and pre-release work.
- No store submission, production purchase, cloud sync, or other external runtime dependency is introduced during the internal-only phase.
- No placeholder or dummy implementation is accepted.

## Loop order

### PHASE 0 — Internal baseline and regression protection
- [x] Confirm current repository head.
- [x] Confirm excluded ZIP remains outside the source of truth.
- [x] Confirm Founder/Team bypass remains present and Godfather tier remains the internal test entitlement.
- [x] Create isolated hardening branch.
- [x] Preserve existing automated quality gates.

### PHASE 1 — P0 correctness and reliability
- [x] OPT-002: fix GW future-base first occurrence.
- [x] Add regression test for future GW base.
- [x] Add regression test for completed future GW base.
- [x] OPT-003: serialize notification reconciliation behind one queue.
- [x] Make `scheduleAlarm()` delegate to reconciliation instead of independently scheduling notifications.
- [x] Preserve deterministic notification ownership and registry behavior.
- [x] OPT-005: retain pending storage snapshot until both primary and last-known-good writes succeed.
- [x] Extend P0 verification to protect the corrected storage write ordering.
- [x] Extend P0 verification to protect the GW boundary fix.
- [x] Extend P0 verification to protect notification serialization.
- [ ] OPT-006: prove a bounded rolling notification window for large alarm sets.
- [ ] Add deterministic tests for 100/500 alarm scheduling behavior.

### PHASE 2 — Local entitlement trust-boundary hardening
- [ ] OPT-001: introduce one native entitlement service as the only premium feature-gate source.
- [ ] Premium feature gates must consume only a verified entitlement snapshot or approved internal Founder/Team test entitlement.
- [ ] Local `state.tier` must never independently unlock paid functionality.
- [ ] OPT-008: enforce Purchase → verification → signed entitlement → cache → feature gate.
- [ ] Add adversarial test that mutates persisted `state.tier` and verifies every premium gate remains Free.
- [ ] Preserve Founder/Team bypass as a separate explicit internal/test trust path.
- [ ] Add expiry, revoke and refund state transitions to local gate tests.

### PHASE 3 — Identity and server authorization boundary
- [ ] OPT-004: require authenticated identity for entitlement reads.
- [ ] Derive owner identity from verified claims rather than arbitrary `userId` input.
- [ ] Add 401/403 adversarial tests for foreign-owner entitlement access.
- [ ] Bind verified purchase ownership to authenticated identity.
- [ ] Add replay/idempotency protection for purchase verification requests.
- [ ] Add webhook reconciliation repair path for missing entitlement records.
- [ ] Validate unknown Apple notification types conservatively; never default unknown states to active entitlement.

### PHASE 4 — Persistence, backup and migration integrity
- [x] Preserve primary/pending/last-known-good recovery ladder.
- [x] Preserve entitlement stripping in backup export/import.
- [ ] Add failure-injection coverage for primary write failure.
- [ ] Add failure-injection coverage for last-known-good write failure.
- [ ] Define one explicit cross-platform backup compatibility contract.
- [ ] Add migration tests for every supported legacy tier/state representation.
- [ ] Add malformed, oversized and cross-reference backup adversarial cases.

### PHASE 5 — Native reliability verification preparation
- [ ] Build deterministic device-test protocol for Android API 36.
- [ ] Fresh install.
- [ ] Notification permission denied/granted.
- [ ] Exact alarm denied/regranted.
- [ ] Reboot.
- [ ] App process death.
- [ ] Force-stop.
- [ ] Doze/battery saver.
- [ ] Timezone change.
- [ ] DST transition.
- [ ] OEM battery management, including Xiaomi/MIUI and Samsung behavior.
- [ ] Build equivalent iOS test protocol.
- [ ] Notification permission denied/granted.
- [ ] Focus.
- [ ] Time Sensitive notifications.
- [ ] App kill/relaunch.
- [ ] Timezone/DST.
- [ ] Purchase/restore.
- [ ] Document every result; no CI contract is allowed to substitute for device evidence.

### PHASE 6 — Observability
- [ ] Add crash reporting architecture suitable for production.
- [ ] Add privacy-minimal notification scheduling/failure telemetry.
- [ ] Add entitlement verification outcome telemetry.
- [ ] Add install/onboarding/first-alarm lifecycle events.
- [ ] Add purchase/restore/refund/churn proxy events without unnecessary gameplay data.
- [ ] Add structured incident diagnostics.

### PHASE 7 — UX / command center
- [ ] Replace feature-first emphasis with `Next Critical Event` as the primary dashboard answer.
- [ ] Show next event.
- [ ] Show account.
- [ ] Show countdown.
- [ ] Show warning schedule.
- [ ] Show notification readiness.
- [ ] Reduce first-launch friction.
- [ ] Add systematic accessibility review.
- [ ] Verify touch target, focus, labels and input assistance behavior.
- [ ] Keep all visible UI free of internal engineering/audit metadata.

### PHASE 8 — Architecture convergence
- [ ] Extract Scheduler Service from `App.tsx`.
- [ ] Extract Entitlement Service.
- [ ] Extract screen-level UI modules.
- [ ] Separate platform adapters from domain contracts.
- [ ] Reduce `App.tsx` responsibility without behavior loss.
- [ ] Converge duplicated web/native domain logic where safe.
- [ ] Prevent web/native pricing and backup drift.
- [ ] Keep domain contracts shared and testable.

### PHASE 9 — Pricing and monetization optimization
- [ ] Keep all existing entitlement capabilities during migration.
- [ ] Simplify Store presentation without silently removing products.
- [ ] Test fewer visible choices against the full SKU catalog.
- [ ] Verify subscription upgrade/downgrade/restore behavior.
- [ ] Verify lifetime behavior.
- [ ] Verify revoked/expired/refunded behavior.
- [ ] Keep Founder/Team internal access intact.

### PHASE 10 — Store compliance and release readiness
- [ ] Verify in-app Privacy Policy access.
- [ ] Verify Terms access.
- [ ] Verify subscription disclosure.
- [ ] Verify renewal/cancellation information.
- [ ] Verify App Store privacy metadata consistency.
- [ ] Verify Google Play Data Safety consistency.
- [ ] Verify final metadata and assets.
- [ ] Verify final AAB/IPA builds.
- [ ] Verify reviewer/test access path.
- [ ] Verify production configuration separately from internal test configuration.

### PHASE 11 — Growth and retention
- [ ] Next Critical Event retention loop.
- [ ] War/Next Event command-center surface.
- [ ] Event presets.
- [ ] Shareable alarm templates.
- [ ] Smart notification bundling.
- [ ] Adaptive warnings to reduce alert fatigue.
- [ ] Optional widgets/lock-screen surfaces after reliability proof.
- [ ] Measure onboarding completion, first alarm creation and notification engagement.

### PHASE 12 — Scale
- [ ] Keep local-first architecture until product-market-fit evidence justifies expansion.
- [ ] If scale requires it: authenticated accounts.
- [ ] Database-backed entitlement store.
- [ ] Idempotent webhooks.
- [ ] Rate limits.
- [ ] Monitoring.
- [ ] Structured logs.
- [ ] Backups.
- [ ] Multi-instance service.
- [ ] Optional cloud sync only after demonstrated user need.

### PHASE 13 — Final polish
- [ ] Typography refinement.
- [ ] Microinteractions.
- [ ] Sound UX refinement.
- [ ] Accessibility completion.
- [ ] Localization layer.
- [ ] Account presentation refinement.
- [ ] Templates.
- [ ] Notification styles.
- [ ] Statistics.
- [ ] Marketing surfaces.

## Explicitly deferred unless evidence changes priority

- More generic timer variants.
- Additional pricing tiers.
- Cosmetic animation before reliability.
- Large cloud-sync platform before product-market-fit evidence.
- RSS expansion without a verified ingestion/user need.
- Complex social features before core reliability and retention.

## Release blockers

The following remain hard blockers until proven otherwise:

- GW first occurrence correctness.
- Single-source notification reconciliation.
- Server-authoritative paid entitlement gating.
- Authenticated entitlement owner binding.
- Failure-safe storage recovery.
- Native device notification matrix.
- Real purchase/restore/revoke evidence.
- Store privacy/data-safety consistency.

## Completion definition

The autonomous loop reaches `COMPLETE` only when every applicable checklist item above is either:

1. implemented and verified, or
2. explicitly marked as not applicable with repository evidence.

External store/device operations are not fabricated as completed. They remain blocked until the required external capability/test environment is available.
