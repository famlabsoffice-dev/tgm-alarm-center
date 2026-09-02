#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-staging.sh"
HEALTH_SCRIPT="$SCRIPT_DIR/check-staging-health.sh"
INSTALL_ROOT="${TGM_STAGING_ROOT:-/var/www/tgm-alarm-center-staging}"
CURRENT_LINK="${TGM_CURRENT_LINK:-$INSTALL_ROOT/current}"
STAGING_URL="${TGM_STAGING_URL:-}"
EXPECTED_COMMIT="${TGM_EXPECTED_COMMIT:-416c98ca64028d4501b8230844deb03a8a118223}"
RELEASE_TAG="${TGM_RELEASE_TAG:-v0.0.1}"

require_file() {
  [[ -x "$1" ]] || { printf 'Executable script is missing: %s\n' "$1" >&2; exit 1; }
}

usage() {
  cat <<'USAGE'
Usage:
  deploy-staging-with-health.sh

Required environment:
  TGM_STAGING_URL       Staging URL used by the post-deployment health-check

Optional environment:
  TGM_STAGING_ROOT      Deployment root, default /var/www/tgm-alarm-center-staging
  TGM_CURRENT_LINK      Active release symlink
  TGM_RELEASE_TAG       Release tag, default v0.0.1
  TGM_EXPECTED_COMMIT   Expected commit in the new release manifest

Exit codes:
  0  Deployment and health-check passed
  1  Deployment completed, health-check failed, rollback completed and passed
  2  Configuration error or rollback itself failed
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$STAGING_URL" ]] || { printf 'TGM_STAGING_URL is required for automatic rollback decisions.\n' >&2; exit 2; }
[[ -x "$DEPLOY_SCRIPT" ]] || { printf 'Deployment script is missing or not executable: %s\n' "$DEPLOY_SCRIPT" >&2; exit 2; }
[[ -x "$HEALTH_SCRIPT" ]] || { printf 'Health-check script is missing or not executable: %s\n' "$HEALTH_SCRIPT" >&2; exit 2; }

previous_target=""
previous_commit=""
if [[ -L "$CURRENT_LINK" ]]; then
  previous_target=$(readlink "$CURRENT_LINK")
  if [[ -s "$previous_target/RELEASE-COMMIT" ]]; then
    previous_commit=$(tr -d '[:space:]' < "$previous_target/RELEASE-COMMIT")
  fi
fi

if ! "$DEPLOY_SCRIPT"; then
  printf 'STAGING DEPLOY FAILED — no automatic rollback was attempted because activation did not complete.\n' >&2
  exit 2
fi

if TGM_STAGING_URL="$STAGING_URL" TGM_STAGING_ROOT="$INSTALL_ROOT" TGM_CURRENT_LINK="$CURRENT_LINK" TGM_EXPECTED_COMMIT="$EXPECTED_COMMIT" TGM_RELEASE_TAG="$RELEASE_TAG" "$HEALTH_SCRIPT"; then
  printf 'STAGING DEPLOYMENT WITH HEALTH PASS — release=%s commit=%s\n' "$RELEASE_TAG" "$EXPECTED_COMMIT"
  exit 0
fi

printf 'STAGING HEALTH FAILED — starting automatic rollback.\n' >&2
if [[ -z "$previous_target" || -z "$previous_commit" || ! -d "$previous_target" ]]; then
  printf 'AUTOMATIC ROLLBACK UNAVAILABLE — no valid previous release was recorded.\n' >&2
  exit 2
fi

if ! "$DEPLOY_SCRIPT" --rollback; then
  printf 'AUTOMATIC ROLLBACK FAILED — manual intervention required.\n' >&2
  exit 2
fi

if TGM_STAGING_URL="$STAGING_URL" TGM_STAGING_ROOT="$INSTALL_ROOT" TGM_CURRENT_LINK="$CURRENT_LINK" TGM_EXPECTED_COMMIT="$previous_commit" TGM_RELEASE_TAG="rollback-from-$RELEASE_TAG" "$HEALTH_SCRIPT"; then
  printf 'AUTOMATIC ROLLBACK PASS — restored_commit=%s restored_path=%s\n' "$previous_commit" "$previous_target"
  exit 1
fi

printf 'AUTOMATIC ROLLBACK HEALTH FAILED — manual intervention required. restored_path=%s\n' "$previous_target" >&2
exit 2
