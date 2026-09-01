#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
STAGING_WRAPPER="$SCRIPT_DIR/deploy-staging-with-health.sh"
PRODUCTION_ROOT="${TGM_PRODUCTION_ROOT:-/var/www/tgm-alarm-center}"
PRODUCTION_URL="${TGM_PRODUCTION_URL:-}"
EXPECTED_COMMIT="${TGM_EXPECTED_COMMIT:-416c98ca64028d4501b8230844deb03a8a118223}"
RELEASE_TAG="${TGM_RELEASE_TAG:-v0.0.1}"
CONFIRMATION="${TGM_PRODUCTION_CONFIRM:-}"

usage() {
  cat <<'USAGE'
Usage:
  deploy-production.sh

Required environment:
  TGM_PRODUCTION_URL       HTTPS URL of the production deployment
  TGM_PRODUCTION_CONFIRM   Must be exactly DEPLOY to authorize production activation

Optional environment:
  TGM_PRODUCTION_ROOT      Release root, default /var/www/tgm-alarm-center
  TGM_EXPECTED_COMMIT      Expected BUILD-MANIFEST sourceCommit
  TGM_RELEASE_TAG          Release tag, default v0.0.1
  TGM_GITHUB_TOKEN         Read token for private GitHub release assets
  TGM_KEEP_RELEASES        Number of releases to retain, default 3

The web server must serve TGM_PRODUCTION_ROOT/current. Release preparation happens
in a new immutable directory; activation is one atomic symlink replacement and does
not restart the web server.

Exit codes:
  0  Deployment and production health-check passed
  1  New release failed its health-check, rollback completed and passed
  2  Safety, deployment, or rollback failure requiring intervention
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$CONFIRMATION" == DEPLOY ]] || {
  printf 'Production deployment blocked: set TGM_PRODUCTION_CONFIRM=DEPLOY.\n' >&2
  exit 2
}
[[ -n "$PRODUCTION_URL" ]] || {
  printf 'Production deployment blocked: TGM_PRODUCTION_URL is required.\n' >&2
  exit 2
}
[[ "$PRODUCTION_URL" == https://* ]] || {
  printf 'Production deployment blocked: TGM_PRODUCTION_URL must use HTTPS.\n' >&2
  exit 2
}
[[ "$PRODUCTION_ROOT" != / && "$PRODUCTION_ROOT" != /var && "$PRODUCTION_ROOT" != /etc ]] || {
  printf 'Production deployment blocked: unsafe installation root.\n' >&2
  exit 2
}
[[ -x "$STAGING_WRAPPER" ]] || {
  printf 'Production deployment blocked: shared deployment wrapper is missing or not executable.\n' >&2
  exit 2
}

export TGM_STAGING_URL="$PRODUCTION_URL"
export TGM_STAGING_ROOT="$PRODUCTION_ROOT"
export TGM_CURRENT_LINK="${TGM_CURRENT_LINK:-$PRODUCTION_ROOT/current}"
export TGM_RELEASES_DIR="${TGM_RELEASES_DIR:-$PRODUCTION_ROOT/releases}"
export TGM_EXPECTED_COMMIT="$EXPECTED_COMMIT"
export TGM_RELEASE_TAG="$RELEASE_TAG"
export TGM_ALLOW_HTTP=0

printf 'PRODUCTION DEPLOYMENT START — release=%s commit=%s url=%s\n' "$RELEASE_TAG" "$EXPECTED_COMMIT" "$PRODUCTION_URL"

set +e
"$STAGING_WRAPPER"
status=$?
set -e

case "$status" in
  0) printf 'PRODUCTION DEPLOYMENT PASS — zero-downtime activation verified.\n' ;;
  1) printf 'PRODUCTION DEPLOYMENT ROLLED BACK — previous release restored and health-checked.\n' >&2 ;;
  *) printf 'PRODUCTION DEPLOYMENT FAILED — manual intervention required.\n' >&2 ;;
esac
exit "$status"
