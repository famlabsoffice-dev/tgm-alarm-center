# Phase 3 — Utility Integration

## Scope

The first-party utility surface is now defined as a canonical event producer. The supported utility categories are GW, Bubble, Events, Protection, Resource timers, Training, Upgrades, and Custom Operations.

## Contract

`firstPartyUtilityEvent()` accepts utility identity and event timing and produces an `AlarmableEvent`. The event keeps UTC timing authoritative and carries the utility category in both canonical category data and metadata. GW and Bubble retain their native alarm types; all other utilities use the existing custom alarm execution path.

`firstPartyUtilityEvents()` deduplicates stable source identities and returns events in deterministic chronological order.

## Safety boundaries

- No public partner API is introduced.
- No TGMhub dependency is introduced.
- Existing alarm scheduling remains the execution authority.
- Existing pricing, entitlements and Founder access remain unchanged.
- Existing local-first persistence remains unchanged.
- Phase 4 authentication/signing/rate limiting is intentionally deferred.

## Verification

Dedicated tests cover GW normalization, utility identity, alarm-type mapping, warning preservation, metadata and deterministic collection deduplication.
