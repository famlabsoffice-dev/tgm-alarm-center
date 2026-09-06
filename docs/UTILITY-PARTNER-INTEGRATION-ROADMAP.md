# TGM Alarm Center — Utility / Partner Integration Roadmap

Stand: 06.09.2026
Execution state: internal contract implementation

## PHASE 3 — Utility Integration

Alarm-ready utility modules:

- GW
- Bubble
- Events
- Protection
- Resource timers
- Training
- Upgrades
- Custom Operations

All utility sources normalize into the shared utility-event contract and then enter the existing alarm scheduling/reconciliation path.

## PHASE 4 — Partner API

Internal contract routes:

- `POST /events`
- `POST /events/bulk`
- `POST /alarms`
- `GET /events`
- `GET /alarm-status`

Security requirements:

- Authentication
- Partner IDs
- Key IDs
- Request signing
- Timestamp freshness
- Nonce/replay protection
- Idempotent event IDs
- Rate limits
- Request/bulk bounds

Public exposure is explicitly disabled at this stage. The repository provides contract definitions and a verification boundary, not a public HTTP service.

## PHASE 5 — TGMhub Integration

TGMhub → Alarm Center:

- event
- start
- end
- category
- metadata

Alarm Center → integration output:

- warnings
- schedule intent
- notifications
- tones
- user preferences

The adapter preserves source event identity and routes scheduling responsibility to the existing alarm engine.

## PHASE 6 — Joint Platform

Future convergence contracts cover:

- shared login
- shared event store
- shared user preferences
- cross-navigation
- cross-upgrade
- shared premium capabilities

These are contracts only until an authenticated shared runtime is approved and implemented.

## PHASE 7 — Acquisition / Combination

Commercial options remain a decision gate rather than an implementation assumption:

- purchase
- equity investment
- exclusive license
- revenue share
- full integration

The gate opens only after real integration evidence exists: user adoption, reliability, event volume, notification engagement, retention, conversion and attributable revenue.
