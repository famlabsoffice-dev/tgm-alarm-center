# TGM Alarm Center — Backup Compatibility Contract

Stand: 05.09.2026
Format: `tgm-alarm-center-backup`
Version: `1`
Schema: `1`

## Contract

The backup format is a UTF-8 JSON document intended to move alarm data between supported TGM Alarm Center native and web-shell implementations without transferring paid entitlement authority.

The top-level object MUST contain exactly the contract fields used by the application: `format`, `version`, `exportedAt`, `schemaVersion`, and `data`. The values are validated before restore.

`data.schemaVersion` MUST be `1`. The application accepts at most 50 accounts, 500 alarms, 500 completed-occurrence keys per alarm, and 16 warning offsets per alarm. A serialized backup larger than 512 KiB MUST be rejected.

## Data invariants

Every account has a unique non-empty `id`, a non-empty name of at most 80 characters, a valid color token, and a valid ISO timestamp for `createdAt`.

Every alarm has a unique `id`, references an account present in the same backup, has a non-empty title of at most 80 characters, uses a supported alarm/repeat/sound value, contains a valid local date/time pair and ISO `eventAtUtc`, uses integer warning offsets from 1 minute through 7 days, and has boolean `active`/`protected` state plus bounded completed-occurrence records and ISO `createdAt`/`updatedAt` timestamps.

`activeAccountId` is either `null` or an account id present in `data.accounts`. Notification preferences MUST use the supported sound profile and boolean preference fields.

## Entitlement boundary

Backups are configuration/data transport, not proof of purchase. Export MUST strip the stored tier to `free`, and restore MUST strip it again before returning application state. A paid tier in an imported document therefore cannot unlock paid functionality.

Founder/Team internal access is not serialized as a paid entitlement in backup data. Its trust path remains outside the backup contract.

## Cross-platform compatibility rules

The native and web-shell implementations MUST interpret the same JSON contract, limits, enum values, relationship rules, and entitlement-stripping behavior. No platform may silently accept a payload rejected by the other platform's contract validator.

Unknown top-level versions or schema versions MUST fail closed. Unknown alarm types, repeat modes, sound profiles, invalid references, malformed timestamps, duplicate ids, and oversized payloads MUST fail closed.

The contract is intentionally schema-1-only in this release. A future schema requires an explicit versioned migration/update to this document and corresponding deterministic tests before it can be accepted by the product.

## Migration test coverage

The compatibility suite covers every currently supported persisted tier value (`free`, `streetBoss`, `caporegime`, `underboss`, `boss`, `godfather`), both valid `activeAccountId` states (`null` and a real account id), both valid `testConfirmedAt` states (`null` and a valid ISO timestamp), entitlement stripping on export and restore, and rejection of malformed, oversized, duplicate-id, missing-reference, and cross-reference payloads.
