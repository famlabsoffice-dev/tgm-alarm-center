# PR #3 — Rebase/Port Status

## Current base

- Base branch: `main`
- Base commit: `891b39eff5406e0d276edb7fabbda611cc61ec31`
- Port branch: `agent/pr3-rebased`

## Ported layers

1. Verified entitlement model with server-only activation semantics.
2. Seven-day offline entitlement cache with expiry and invalid-cache handling.
3. Apple ES256 JWS and Google RS256/OIDC verification primitives.
4. Idempotent file-backed billing repository with atomic persistence.
5. Apple/Google purchase verification service bound to the current 25-product catalog.
6. HTTPS verification client with strict response validation.
7. Isolated Node billing verification server and Apple/Google webhook routes.
8. Deterministic provider-signature and webhook-idempotency tests.

## Safety constraints preserved

- Current `main` product catalog remains authoritative.
- No downgrade of the installed `expo-iap` version.
- No server module is imported by the mobile runtime.
- Missing production credentials do not create paid entitlements.
- Local purchase state is not treated as server verification.
- Webhook events are idempotently recorded before applying side effects.

## Validation

The initial port commit passed the canonical release verification. A subsequent validation run identified and corrected one TypeScript structural-cast error in `src/billing/verificationClient.ts`. The corrected branch is now the PR head; the CI result for that exact head must be green before merge.

## Merge rule

Do not merge until the exact PR head passes `pnpm verify:full-release`, all billing/server tests pass, the working tree is clean, and the security review confirms no unverified unlock path.
