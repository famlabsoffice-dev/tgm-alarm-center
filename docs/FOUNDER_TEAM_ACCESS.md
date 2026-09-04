# TGM Alarm Center — Founder/Team Access Contract

## Status

This is a hard release requirement. GitHub Issue #17 is the authoritative project-level record: **HARD REQUIREMENT: Founder Team Godfather Lifetime Access**.

## Authorized developer/team test identities

The following five account identities are permanently authorized:

- `TGMack`
- `TGMkellz`
- `TGMj9`
- `TGMvany`
- `TGMred`

Matching is exact after trimming surrounding whitespace and is case-insensitive. No other identity is a Founder identity.

## Required entitlement

Every authorized identity receives **Godfather Lifetime** access automatically. The entitlement:

- requires no payment;
- requires no Store/IAP transaction;
- remains effective after application restart;
- remains effective after valid backup/restore;
- must survive refactoring, migrations, security hardening and releases.

The normal persisted plan value does not revoke Founder access: effective access is derived from the canonical Founder identity check.

## Security boundary

The Founder contract is intentionally limited to the five exact identities. Substrings, prefixes, suffixes and look-alike names are not authorized.

The current native/test architecture uses the account name as its local identity primitive. This is suitable for the standalone developer/team test build. A future authenticated/server-side entitlement system MUST preserve these five identities as explicitly authorized developer/team test accounts and MUST NOT infer Founder authority from an unverified client-controlled claim.

## Release gate

A release is non-compliant if any of the following occurs:

1. one of the five identities no longer resolves to `godfather`;
2. a non-authorized identity resolves to Founder access through partial or fuzzy matching;
3. Founder access depends on payment or Store/IAP;
4. restart or valid backup/restore removes effective Founder access;
5. refactoring, migration, security hardening or release work can silently disable the contract.

The dedicated gate is available as `node scripts/verify-founder-access.mjs` and is enforced by `.github/workflows/founder-access-gate.yml` on pushes to `main` and pull requests.
