# Release Candidate Gate

## Mandatory sequence

1. Reliability
2. Account isolation
3. Notification reliability
4. Complete regression run
5. Real Android validation
6. Release Candidate

## Automated gate

The `release-candidate-gates` workflow executes:

- typecheck
- lint
- complete regression suite
- Android reliability contract
- native device matrix contract
- full release verification
- internal Android APK build when `EXPO_TOKEN` is available

Static checks never claim physical-device success.

## Physical Android acceptance

A release candidate is not considered physically validated until the device matrix contains evidence for:

- fresh install
- notification denied/granted
- exact-alarm denied/re-granted
- lockscreen delivery
- background delivery
- process death
- force-stop
- reboot
- Doze / battery saver
- OEM battery restriction
- timezone change
- DST transition

Required Android families include AOSP API 36, Samsung API 36 and Xiaomi API 36.

Each executed case must record result `PASS`, `FAIL` or `BLOCKED` plus an evidence reference. A static verifier may validate completeness of the matrix, but it must never synthesize physical evidence.
