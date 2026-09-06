# TGM Alarm Center — Internal Utility / Partner Contract

Stand: 06.09.2026
Status: internal-only contract system

## Phase 3 — Utility integration

The following utility categories can produce a normalized `UtilityEventInput`: `gw`, `bubble`, `event`, `protection`, `resource`, `training`, `upgrade`, `custom-operation`.

Every utility event is validated before it becomes an alarm intent. The alarm engine remains the single owner of scheduling and notification reconciliation.

## Phase 4 — Private partner contract

Contract routes:

- `POST /events`
- `POST /events/bulk`
- `POST /alarms`
- `GET /events`
- `GET /alarm-status`

Security contract:

1. authenticated Partner ID and key ID
2. timestamp freshness window of five minutes
3. nonce for replay protection at the receiving runtime
4. canonical request representation
5. cryptographic signature verification at the receiving runtime
6. bounded request and bulk sizes
7. explicit API versioning
8. idempotent event IDs

This repository contains the platform-neutral contract and verification boundary. It does **not** expose a public HTTP server. Public exposure requires an authenticated external runtime and a separate release decision.

## Phase 5 — TGMhub

TGMhub supplies `event`, `start`, `end`, `category`, and `metadata`. The adapter maps this into the same normalized utility event contract. TGM Alarm Center supplies warning schedule, notification behavior, tones, and user preferences.

## Phase 6 — Joint platform

Shared identity, event records, user preferences, cross-navigation and cross-upgrade are represented as explicit contracts only. A shared backend is intentionally not introduced during internal integration work.

## Phase 7 — Commercial decision gate

No acquisition, equity, exclusive-license, revenue-share, or full-integration commitment is implied by the code. The decision gate is opened only after measurable integration evidence exists: active users, event volume, notification engagement, retention, conversion, reliability and attributable revenue.

## Release gates

The contract cannot become public until:

- authentication runtime exists;
- Partner IDs and key lifecycle are operational;
- replay/idempotency storage exists;
- cryptographic signing is verified end-to-end;
- rate limiting is enforced server-side;
- contract tests pass on both sides;
- abuse/error monitoring exists;
- privacy and data-processing requirements are reviewed;
- a controlled partner allowlist is approved.
