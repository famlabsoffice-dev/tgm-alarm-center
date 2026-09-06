# TGM Alarm Center — Platform Foundation

## Phase 1 status

Phase 1 establishes a source-independent canonical event layer without changing the existing alarm UI, pricing, local persistence, notification delivery, or existing alarm semantics.

## Canonical model

`AlarmableEvent` is the platform boundary for every future event source. It contains:

- stable source-scoped identity
- source and source instance
- title and description
- category
- UTC start and optional UTC end
- source timezone metadata
- priority
- alarm type and repeat mode
- warning schedule
- sound profile
- notification action
- typed metadata
- creation/update timestamps

UTC is authoritative for platform event timing. The existing alarm domain remains the execution model.

## Source adapters

`EventSourceAdapter` and `EventSourceRegistry` keep external integrations isolated from the alarm domain. A partner such as TGMhub can eventually provide events through an adapter without becoming a dependency of the core alarm engine.

The canonical adapter enforces source identity so an event cannot silently be attributed to a different partner/source instance.

## Event → Alarm bridge

`alarmFromEvent()` converts a normalized `AlarmableEvent` into the existing `Alarm` structure. This deliberately reuses the current alarm types, warning minutes, repeat modes, sounds, protection semantics, account ownership and occurrence tracking.

No external service is called by this foundation. It is an internal domain boundary ready for a later ingestion/API layer.

## Compatibility rules

1. Existing alarm functionality remains authoritative.
2. Existing consumer pricing and entitlements remain unchanged.
3. Existing founder access remains unchanged.
4. Existing local-first persistence remains unchanged.
5. No external partner can directly mutate local alarms through this foundation.
6. No TGMhub-specific code is embedded in the canonical model.
7. Partner identity is represented as data (`source`, `sourceId`), not hardcoded product logic.
8. Invalid timestamps, identities, titles and warning schedules are rejected before normalization.
9. Duplicate canonical event IDs resolve to the newest `updatedAt` representation.

## Next platform phases

Phase 2 can add an Event Inbox, Add to Alarm, recommended warning presets and event-to-alarm UX. Phase 3 can add first-party utility modules. Phase 4 can introduce an authenticated partner contract/API. A TGMhub integration should only be added after that generic contract is stable.

## Verification

`tests/platform-foundation.test.ts` covers normalization, validation, adapter identity, event-to-alarm conversion and deterministic deduplication.
