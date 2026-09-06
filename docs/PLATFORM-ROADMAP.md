# TGM Alarm Center — Platform Roadmap

## Phase 3 — Utility Integration

TGM Alarm Center's own future utility modules are directly alarm-capable through the canonical `AlarmableEvent` boundary. The initial first-party utility categories are:

- GW
- Bubble
- Events
- Protection
- Resource timers
- Training
- Upgrades
- Custom Operations

Each utility emits normalized events and delegates alarm execution to the existing alarm domain. Utility modules do not duplicate notification scheduling, warning logic, sound handling, timezone conversion, or tier enforcement.

### Phase 3 contract

A first-party utility event must provide a stable source identity, stable event identity, title, UTC start time, optional UTC end time, category, and metadata. The platform supplies warning presets, alarm conversion, local presentation, and native notification scheduling.

Phase 3 is additive: existing alarms, pricing, entitlements, founder access, local-first persistence, and native notification behavior remain authoritative.

## Phase 4 — Partner API

The partner contract is internal first and must not be publicly exposed until security and operational gates are satisfied.

Planned endpoints:

- `POST /events`
- `POST /events/bulk`
- `POST /alarms`
- `GET /events`
- `GET /alarm-status`

The contract will include authentication, partner IDs, rate limits, request signing, replay protection, validation, deterministic event identity, and auditability. No public API exposure is part of Phase 3.

## Phase 5 — TGMhub Integration

First integration target: `Powered by TGM Alarm Center`.

TGMhub supplies:

- event
- start
- end
- category
- metadata

TGM Alarm Center supplies:

- warnings
- schedule
- notifications
- tones
- user preferences

The integration must use the generic partner contract rather than TGMhub-specific core logic.

## Phase 6 — Joint Platform

If the integration proves successful, evaluate:

- shared login
- shared event store
- shared user preferences
- cross-navigation
- cross-upgrade
- shared premium functions

These are post-integration options, not prerequisites for Phase 3.

## Phase 7 — Acquisition / Merger

Only after real user and revenue data exists should the parties evaluate:

- acquisition
- equity participation
- exclusive licensing
- revenue share
- full integration

The decision is data-driven rather than speculative.

## Current execution boundary

Phase 3 is the active engineering phase. Phase 4 remains internal-only by design. Phases 5–7 are explicitly sequenced after Phase 4 validation and are not implemented prematurely.
