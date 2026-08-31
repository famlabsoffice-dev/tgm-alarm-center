# TGM ALARM CENTER — Pre-Release Validation

## Implemented in this release branch

- Local-first persistent data model with schema version 1.
- Accounts and central active-account selection.
- Bubble, GW Bubble and Custom alarm templates with required defaults.
- Strict local date/time validation before persistence.
- One-time and daily occurrences.
- Absolute UTC persistence with local display.
- Daily recurrence reconstructed from local wall-clock time so DST changes do not turn a daily 10:30 alarm into a fixed UTC interval.
- Five-day GW cycle with a 24-hour protection window, start, end-warning and end occurrence.
- Warning occurrences are ordered before their corresponding main event.
- Occurrence-specific completion keys: alarm ID plus concrete event timestamp.
- Protection state independent from active/paused state.
- Centralized tier configuration and account alarm limits.
- Duplicate operation creates a new ID, clears completion history and starts paused.
- Pause/resume removes and rebuilds the active web schedule.
- Web notification permission handling and in-session scheduling with a bounded 30-day horizon and 64-notification cap.
- Web Health explicitly distinguishes browser support from native Android/iOS delivery.
- JSON backup export and strict whole-backup validation/import.
- Landscape PWA configuration and versioned offline cache.
- Deterministic static validation script and CI workflow definition.

## Explicit production gates still requiring real credentials, native builds or physical devices

1. Android exact alarms and `POST_NOTIFICATIONS` on supported Android versions.
2. iOS notification permissions, sound, vibration and allowed time-sensitive/critical behavior.
3. Reboot, force-close, locked-screen, Doze, battery-optimization and OEM matrix.
4. Real local notification sound assets (`alarm-pulse.wav`, `alarm-siren.wav`, `alarm-chime.wav`) integrated into native builds.
5. StoreKit product configuration, purchase, transaction verification and Restore Purchases.
6. Google Play product configuration, purchase verification and Restore/Resync.
7. Production authentication providers, sessions, token lifecycle and account isolation.
8. Production cloud-sync backend, encrypted transport/storage, device management and conflict resolution.
9. External alarm forwarding, SMS, push, sensor/gateway and control-center endpoints plus credentials.
10. Release signing, AAB/IPA archives, final identifiers, Store metadata, privacy/legal documents and IP/brand clearance.
11. Real Android and iPhone release-candidate validation.

The branch intentionally does not mark any unverified native, store, cloud or external-integration capability as successful.
