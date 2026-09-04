# TGM ALARM CENTER — PHASE 0 LAUNCH BASIS

**Scope:** repository-only Go-to-Market preparation that can be completed without external accounts, infrastructure, store access, analytics providers or legal approval.

## Objective

Create a single, reusable launch basis for the first community-facing release while keeping every external gate explicitly blocked until it has a real owner, URL, account, credential, legal decision or store verification.

## Product promise

**A local gaming alarm center for Bubble, Massacre and event time windows — so important gaming moments stay visible and actionable.**

The product is an independent utility and must not imply official affiliation, endorsement or partnership with the publisher or game operator.

## Customer-facing terminology

| Internal capability | Customer-facing name |
|---|---|
| Bubble alarm | **Bubble Alarm** |
| GW / protection cycle | **Massacre Alarm** |
| Custom event | **Event Alarm** |
| Individual timer | **Individual Timer** |
| RSS timer | **RSS Timer** |
| Main product category | **TGM Command Center** |

The terminology is intentionally short and action-oriented. It must remain consistent across onboarding, alarm creation, empty states, screenshots, store metadata and support material.

## First-session success path

The repository can prepare the complete product path without external infrastructure:

1. Open the app.
2. Identify the active account.
3. Choose an alarm type.
4. Enter the event time.
5. Select at least one warning.
6. Select/test the intended local sound.
7. Save the alarm.
8. Confirm the next alarm is visible.
9. Reload/reopen and confirm persisted state.

**Activation definition:** the first successfully saved alarm.

**Retention definition:** a meaningful second use after the first alarm, to be measured only once real analytics infrastructure exists.

## Launch copy set

### One-line description

> Gaming-Alarme, Vorwarnungen und Zyklen für zeitkritische Events.

### Short product description

> Plane Bubble-, Massacre- und Event-Alarme mit Vorwarnungen, Countdown, lokalen Tönen und wiederkehrenden Zyklen. Deine Alarmdaten bleiben auf deinem Gerät.

### Store-safe independent-utility statement

> TGM ALARM CENTER ist eine unabhängige Gaming-Utility und keine offizielle Anwendung des Spieleherstellers oder -betreibers.

This statement is a product/legal positioning aid, not a substitute for trademark clearance or legal review.

## Support model prepared for launch

### Supported issue classes

- Alarm not scheduled as expected
- Notification permission problems
- Sound problems
- Account-switching or stale-state problems
- Backup/restore problems
- Purchase/restore problems after store activation
- Data deletion requests
- General usability feedback

### First-response procedure

1. Record the reported platform and app version.
2. Record the alarm type and intended event time.
3. Determine whether the issue is reproducible.
4. Protect user data: never request a private backup unless required and voluntarily supplied.
5. Classify as reliability, notification, account isolation, billing, UX or external-platform issue.
6. Reproduce before changing product behavior.
7. Add a regression test for every confirmed product defect.
8. Close only after the fix is verified against the relevant release gate.

**External dependency:** a real public support address/channel still has to be provisioned before store submission.

## Privacy/data statement prepared for publication

The current product architecture stores accounts, alarms, settings and backups locally on the user's device/browser. The repository does not require a central account database or synchronization service for these core data.

The final public privacy policy must be generated and reviewed against the actual signed native binary and all production SDKs before submission.

**External dependency:** a public HTTPS privacy-policy URL.

## Measurement contract

No external analytics are introduced in Phase 0.

The canonical events prepared for later measurement are:

| Event | Definition |
|---|---|
| `install` | First installation/first contact where the platform can reliably provide it |
| `activation` | First successfully persisted alarm |
| `first_alarm` | First created alarm |
| `second_use` | Second meaningful product use after activation |
| `upgrade` | Successful transition to a paid entitlement |
| `cancellation` | Cancellation/end of a paid entitlement |

No real user counts, conversion rates or retention rates may be inferred from local test data.

## Store metadata readiness

The repository already contains canonical store metadata and technical validation. Phase 0 treats the following as source-of-truth inputs:

- app name and identifiers
- localized store titles and descriptions
- pricing catalog
- screenshot inventory
- icon and feature graphic inventory
- independent-utility positioning
- privacy/support URL requirements
- trademark-clearance requirement
- final-binary screenshot requirement

Before publication, all store text and visual assets must be reconciled against the actual signed binary.

## External launch gates — deliberately not fabricated

| Gate | Repository preparation | External action still required |
|---|---|---|
| Support | Support procedure defined | Real public support channel |
| Privacy | Data-processing statement prepared | Public HTTPS privacy policy |
| Trademark | Risk register maintained | Clearance/licence or rebrand decision |
| Google Play | Metadata/assets/configuration prepared | Developer account, products, forms, signing, testing and submission |
| Apple | Metadata/assets/configuration prepared | Developer account, products, forms, signing, testing and submission |
| Billing | Product catalog/code prepared | Real store products, provider key and sandbox verification |
| Analytics | Event contract defined | External analytics provider, if/when selected |
| Device validation | Automated checks prepared | Signed binaries and physical-device verification |

## Phase 0 exit criteria

Phase 0 is **repository-ready** when:

- customer-facing terminology is consistent;
- product promise and independent-utility positioning are defined;
- first-session activation path is explicit;
- support classification/process is documented;
- privacy/data statement matches the local-first architecture;
- measurement events have deterministic definitions;
- store metadata/assets have one documented source of truth;
- every external blocker is named instead of simulated.

### Current status

**PHASE 0 — REPOSITORY READY**

This status means the launch basis is executable as soon as the external gates become available. It does **not** mean the app is store-submitted or legally cleared.
