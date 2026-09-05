# TGM Alarm Center — Autonomous Loop Execution Master

Stand: 05.09.2026
Basis: `main` at `c957ad47fa14d2c5fc4c944654feb6d502c666a5`
Arbeitsbranch: `loop/phase4-backup-migration-hardening`

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
- [x] OPT-006: prove a bounded rolling notification window for large alarm sets.
- [x] Add deterministic tests for 100/500 alarm scheduling behavior.

### PHASE 2 — Local entitlement trust-boundary hardening
- [x] OPT-001: introduce one native entitlement service as the only premium feature-gate source.
- [x] Premium feature gates consume only a verified entitlement snapshot or approved internal Founder/Team test entitlement.
- [x] Local `state.tier` never independently unlocks paid functionality.
- [ ] OPT-008: enforce Purchase → verification → signed entitlement → cache → feature gate.
- [x] Add adversarial test that mutates persisted `state.tier` and verifies the premium gate remains Free.
- [x] Preserve Founder/Team bypass as a separate explicit internal/test trust path.
- [x] Add expiry, revoke and refund state transitions to local gate tests.

### PHASE 3 — Identity and server authorization boundary
- [ ] OPT-004: require authenticated identity for entitlement reads.
- [ ] Derive owner identity from verified claims rather than arbitrary `userId` input.
- [ ] Add 401/403 adversarial tests for foreign-owner entitlement access.
- [ ] Bind verified purchase ownership to authenticated identity.
- [ ] Add replay/idempotency protection for purchase verification requests.
- [ ] Add webhook reconciliation repair path for missing entitlement records.
- [ ] Validate unknown Apple notification types conservatively; never default unknown states to active entitlement.
- [ ] **External runtime dependency:** repository currently contains no authenticated entitlement server runtime; implementation remains explicitly deferred until that external authorization surface exists.

### PHASE 4 — Persistence, backup and migration integrity
- [x] Preserve primary/pending/last-known-good recovery ladder.
- [x] Preserve entitlement stripping in backup export/import.
- [x] Add failure-injection coverage for primary write failure.
- [x] Add failure-injection coverage for last-known-good write failure.
- [x] Define one explicit cross-platform backup compatibility contract.
- [x] Add migration tests for every supported legacy tier/state representation.
- [x] Add malformed, oversized and cross-reference backup adversarial cases.

### PHASE 5 — Native reliability verification preparation
- [x] Build deterministic device-test protocol for Android API 36.
- [ ] Fresh install.
- [ ] Notification permission denied/granted.
- [ ] Exact-alarm permission denied/regranted.
- [ ] Reboot.
- [ ] App process death.
- [ ] Force-stop.
- [ ] Doze/battery saver.
- [ ] Timezone change.
- [ ] DST transition.
- [ ] OEM battery management, including Xiaomi/MIUI and Samsung behavior.
- [x] Build equivalent iOS test protocol.
- [ ] Notification permission denied/granted.
- [ ] Focus.
- [ ] Time Sensitive notifications.
- [ ] App kill/relaunch.
- [ ] Timezone/DST.
- [ ] Purchase/restore.
- [ ] Document every result; no CI contract is allowed to substitute for device evidence.
- [ ] **External device dependency:** no device farm or physical-device runtime evidence is fabricated by CI.

### PHASE 6 — Observability
- [x] Add crash reporting architecture suitable for production.
- [x] Add privacy-minimal notification scheduling/failure telemetry as a local bounded diagnostic contract.
- [x] Add entitlement verification outcome telemetry as a local bounded diagnostic contract.
- [x] Add install/onboarding/first-alarm lifecycle events to the diagnostic contract.
- [x] Add purchase/restore/refund/churn proxy events without unnecessary gameplay data to the diagnostic contract.
- [x] Add structured incident diagnostics.
- [x] **Internal-only constraint:** no telemetry endpoint is introduced without an approved external runtime.

### PHASE 7 — UX / command center
- [x] Replace feature-first emphasis with `Next Critical Event` as the primary dashboard answer.
- [x] Show next event.
- [x] Show account.
- [x] Show countdown.
- [x] Show warning schedule.
- [x] Show notification readiness.
- [x] Reduce first-launch friction.
- [ ] Add systematic accessibility review.
- [x] Verify touch target, focus, labels and input assistance behavior for the web shell.
- [x] Keep visible UI free of internal engineering/audit metadata.

### PHASE 8 — Architecture convergence
- [ ] Extract Scheduler Service from `App.tsx`.
- [x] Extract Entitlement Service.
- [ ] Extract screen-level UI modules.
- [ ] Separate platform adapters from domain contracts.
- [ ] Reduce `App.tsx` responsibility without behavior loss.
- [ ] Converge duplicated web/native domain logic where safe.
- [ ] Prevent web/native pricing and backup drift.
- [x] Keep domain contracts shared and testable.

### PHASE 9 — Pricing and monetization optimization
- [x] Keep all existing entitlement capabilities during migration.
- [ ] Simplify Store presentation without silently removing products.
- [ ] Test fewer visible choices against the full SKU catalog.
- [ ] Verify subscription upgrade/downgrade/restore behavior.
- [ ] Verify lifetime behavior.
- [x] Verify revoked/expired/refunded behavior at the local entitlement-gate layer.
- [x] Keep Founder/Team internal access intact.

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
- [ ] **External store dependency:** store submission, production purchase/restore and final reviewer evidence require external store access and are not fabricated.

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
- [x] Accessibility completion for the verified web-shell surface.
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
