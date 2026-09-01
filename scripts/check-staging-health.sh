#!/usr/bin/env bash
set -Eeuo pipefail

STAGING_URL="${TGM_STAGING_URL:-}"
INSTALL_ROOT="${TGM_STAGING_ROOT:-/var/www/tgm-alarm-center-staging}"
CURRENT_LINK="${TGM_CURRENT_LINK:-$INSTALL_ROOT/current}"
EXPECTED_COMMIT="${TGM_EXPECTED_COMMIT:-416c98ca64028d4501b8230844deb03a8a118223}"
RELEASE_TAG="${TGM_RELEASE_TAG:-v0.0.1}"
TIMEOUT_SECONDS="${TGM_HEALTH_TIMEOUT:-10}"
ALLOW_HTTP="${TGM_ALLOW_HTTP:-0}"
JSON_OUTPUT="${TGM_HEALTH_FORMAT:-text}"

usage() {
  cat <<'USAGE'
Usage:
  check-staging-health.sh

Required environment:
  TGM_STAGING_URL       Public or internal staging URL, e.g. https://staging.example.com

Optional environment:
  TGM_STAGING_ROOT      Deployment root, default /var/www/tgm-alarm-center-staging
  TGM_CURRENT_LINK      Active release symlink, default $TGM_STAGING_ROOT/current
  TGM_EXPECTED_COMMIT   Expected BUILD-MANIFEST sourceCommit
  TGM_RELEASE_TAG       Release label, default v0.0.1
  TGM_HEALTH_TIMEOUT    Curl timeout in seconds, default 10
  TGM_ALLOW_HTTP        Set to 1 only for an explicitly internal HTTP staging endpoint
  TGM_HEALTH_FORMAT     text or json, default text
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

require_command() {
  command -v "$1" >/dev/null 2>&1 || { printf 'Required command is missing: %s\n' "$1" >&2; exit 1; }
}
for command_name in curl readlink test grep awk find; do require_command "$command_name"; done

[[ -n "$STAGING_URL" ]] || { printf 'TGM_STAGING_URL is required.\n' >&2; exit 2; }
[[ "$JSON_OUTPUT" == text || "$JSON_OUTPUT" == json ]] || { printf 'TGM_HEALTH_FORMAT must be text or json.\n' >&2; exit 2; }
[[ "$TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] || { printf 'TGM_HEALTH_TIMEOUT must be a positive integer.\n' >&2; exit 2; }
if [[ "$STAGING_URL" != https://* && "$ALLOW_HTTP" != 1 ]]; then
  printf 'Staging URL must use HTTPS. Set TGM_ALLOW_HTTP=1 only for explicitly internal HTTP staging.\n' >&2
  exit 2
fi

failures=()
add_failure() { failures+=("$1"); }
check_local() {
  if [[ ! -L "$CURRENT_LINK" ]]; then add_failure "active symlink missing: $CURRENT_LINK"; return; fi
  local active release_commit manifest_commit release_sha
  active=$(readlink "$CURRENT_LINK")
  [[ -d "$active" ]] || { add_failure "active release directory missing: $active"; return; }
  [[ -s "$active/RELEASE-COMMIT" ]] || add_failure "RELEASE-COMMIT missing in active release";
  [[ -s "$active/RELEASE-SHA256" ]] || add_failure "RELEASE-SHA256 missing in active release";
  [[ -s "$active/BUILD-MANIFEST.json" ]] || add_failure "BUILD-MANIFEST.json missing in active release";
  release_commit=$(tr -d '[:space:]' < "$active/RELEASE-COMMIT" 2>/dev/null || true)
  manifest_commit=$(awk -F'"' '/"sourceCommit"/ { print $4; exit }' "$active/BUILD-MANIFEST.json" 2>/dev/null || true)
  release_sha=$(tr -d '[:space:]' < "$active/RELEASE-SHA256" 2>/dev/null || true)
  [[ "$release_commit" == "$EXPECTED_COMMIT" ]] || add_failure "release commit mismatch: expected $EXPECTED_COMMIT, got ${release_commit:-empty}"
  [[ "$manifest_commit" == "$EXPECTED_COMMIT" ]] || add_failure "manifest commit mismatch: expected $EXPECTED_COMMIT, got ${manifest_commit:-empty}"
  [[ "$release_sha" =~ ^[0-9a-fA-F]{64}$ ]] || add_failure "invalid release SHA-256 marker"
  for required_file in index.html app.js styles.css sw.js manifest.webmanifest icon.png assets/notifications/alarm-pulse.wav assets/notifications/alarm-siren.wav assets/notifications/alarm-chime.wav; do
    [[ -s "$active/$required_file" ]] || add_failure "required local file missing or empty: $required_file"
  done
}

check_http() {
  local base="${STAGING_URL%/}" body_file headers_file
  body_file=$(mktemp)
  headers_file=$(mktemp)
  trap 'rm -f "$body_file" "$headers_file"' RETURN
  if ! curl --fail --silent --show-error --location --proto '=https,http' --tlsv1.2 --max-time "$TIMEOUT_SECONDS" --dump-header "$headers_file" "$base/" --output "$body_file"; then
    add_failure "staging root request failed: $base/"
    return
  fi
  grep -q 'TGM ALARM CENTER' "$body_file" || add_failure 'staging root does not contain the expected application title'
  for asset in app.js styles.css sw.js manifest.webmanifest icon.png assets/notifications/alarm-pulse.wav assets/notifications/alarm-siren.wav assets/notifications/alarm-chime.wav; do
    curl --fail --silent --show-error --location --proto '=https,http' --tlsv1.2 --max-time "$TIMEOUT_SECONDS" "$base/$asset" --output /dev/null || add_failure "asset request failed: $asset"
  done
}

check_local
check_http

status=0
if ((${#failures[@]})); then status=1; fi
if [[ "$JSON_OUTPUT" == json ]]; then
  if ((status)); then
    printf '{"status":"fail","releaseTag":"%s","expectedCommit":"%s","failures":[' "$RELEASE_TAG" "$EXPECTED_COMMIT"
    printf '%s\n' "$(printf '"%s",' "${failures[@]}" | sed 's/,$//')" | tr -d '\n'
    printf ']}\n'
  else
    printf '{"status":"pass","releaseTag":"%s","expectedCommit":"%s","stagingUrl":"%s"}\n' "$RELEASE_TAG" "$EXPECTED_COMMIT" "$STAGING_URL"
  fi
else
  if ((status)); then
    printf 'STAGING HEALTH FAIL — %s\n' "$RELEASE_TAG"
    printf ' - %s\n' "${failures[@]}"
  else
    printf 'STAGING HEALTH PASS — release=%s commit=%s url=%s\n' "$RELEASE_TAG" "$EXPECTED_COMMIT" "$STAGING_URL"
  fi
fi
exit "$status"
