#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
HEALTH_SCRIPT="${TGM_HEALTH_SCRIPT:-$SCRIPT_DIR/check-staging-health.sh}"
STAGING_ROOT="${TGM_STAGING_ROOT:-/var/www/tgm-alarm-center-staging}"
STATE_FILE="${TGM_MONITOR_STATE_FILE:-$STAGING_ROOT/.monitoring/staging-health-state.json}"
ALERT_WEBHOOK_URL="${TGM_ALERT_WEBHOOK_URL:-}"
ALERT_ON_RECOVERY="${TGM_ALERT_ON_RECOVERY:-1}"

usage() {
  cat <<'USAGE'
Usage:
  monitor-staging-health.sh

Required environment:
  TGM_STAGING_URL       Public or internal staging URL, e.g. https://staging.example.com

Optional environment:
  TGM_STAGING_ROOT      Deployment root, default /var/www/tgm-alarm-center-staging
  TGM_CURRENT_LINK      Active release symlink, default $TGM_STAGING_ROOT/current
  TGM_EXPECTED_COMMIT   Expected BUILD-MANIFEST sourceCommit
  TGM_RELEASE_TAG       Release label, default v0.0.1
  TGM_HEALTH_TIMEOUT    Curl timeout in seconds, default 10
  TGM_ALLOW_HTTP        Set to 1 only for explicitly internal HTTP staging
  TGM_HEALTH_SCRIPT     Override the health-check script path
  TGM_MONITOR_STATE_FILE
                        JSON state path, default /var/lib/tgm-alarm-center/staging-health-state.json
  TGM_ALERT_WEBHOOK_URL HTTPS webhook for failure and recovery notifications
  TGM_ALERT_ON_RECOVERY Set to 0 to suppress recovery notifications, default 1

The command performs one health check and exits 0 on PASS, 1 on health failure,
or 2 on configuration or monitoring errors. It is safe to invoke from cron,
systemd timers, or CI/CD; it does not modify the active release symlink.
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is missing: %s\n' "$1" >&2
    exit 2
  }
}
for command_name in awk bash cat curl date mkdir mktemp mv printf sed tr; do require_command "$command_name"; done

[[ -n "${TGM_STAGING_URL:-}" ]] || {
  printf 'TGM_STAGING_URL is required.\n' >&2
  exit 2
}
if [[ "${TGM_STAGING_URL}" != https://* && "${TGM_ALLOW_HTTP:-0}" != 1 ]]; then
  printf 'Staging URL must use HTTPS. Set TGM_ALLOW_HTTP=1 only for explicitly internal HTTP staging.\n' >&2
  exit 2
fi

[[ -x "$HEALTH_SCRIPT" ]] || {
  printf 'Health-check script is missing or not executable: %s\n' "$HEALTH_SCRIPT" >&2
  exit 2
}
[[ "$ALERT_ON_RECOVERY" == 0 || "$ALERT_ON_RECOVERY" == 1 ]] || {
  printf 'TGM_ALERT_ON_RECOVERY must be 0 or 1.\n' >&2
  exit 2
}
if [[ -n "$ALERT_WEBHOOK_URL" && "$ALERT_WEBHOOK_URL" != https://* ]]; then
  printf 'TGM_ALERT_WEBHOOK_URL must use HTTPS.\n' >&2
  exit 2
fi

state_dir=$(dirname -- "$STATE_FILE")
if ! mkdir -p -- "$state_dir" 2>/dev/null; then
  printf 'Cannot create monitoring state directory: %s\n' "$state_dir" >&2
  exit 2
fi

previous_status="unknown"
if [[ -r "$STATE_FILE" ]]; then
  previous_status=$(awk -F'"' '/"status"/ { print $4; exit }' "$STATE_FILE" 2>/dev/null || true)
  [[ "$previous_status" == pass || "$previous_status" == fail ]] || previous_status="unknown"
fi

health_output_file=$(mktemp)
trap 'rm -f -- "$health_output_file"' EXIT
set +e
TGM_HEALTH_FORMAT=json "$HEALTH_SCRIPT" >"$health_output_file" 2>&1
health_exit=$?
set -e
health_output=$(cat -- "$health_output_file")
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if ((health_exit == 0)); then
  current_status=pass
else
  current_status=fail
fi

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/$/\\n/' | tr -d '\n'
}

escaped_output=$(json_escape "$health_output")
tmp_state=$(mktemp "${STATE_FILE}.XXXXXX")
printf '{"status":"%s","exitCode":%s,"checkedAt":"%s","output":"%s"}\n' \
  "$current_status" "$health_exit" "$now" "$escaped_output" >"$tmp_state"
if ! mv -- "$tmp_state" "$STATE_FILE"; then
  rm -f -- "$tmp_state"
  printf 'Cannot atomically update monitoring state: %s\n' "$STATE_FILE" >&2
  exit 2
fi

send_alert() {
  local event="$1" message="$2" payload
  [[ -n "$ALERT_WEBHOOK_URL" ]] || return 0
  payload=$(printf '{"event":"%s","service":"tgm-alarm-center-staging","timestamp":"%s","message":"%s"}\n' \
    "$(json_escape "$event")" "$now" "$(json_escape "$message")")
  curl --fail --silent --show-error --max-time 10 \
    --header 'Content-Type: application/json' \
    --data-binary "$payload" "$ALERT_WEBHOOK_URL" >/dev/null
}

if [[ "$current_status" == fail ]]; then
  failure_message="TGM staging health failed with exit code $health_exit: $health_output"
  if ! send_alert failure "$failure_message"; then
    printf 'Health check failed and alert delivery failed.\n%s\n' "$failure_message" >&2
    exit 1
  fi
  printf '%s\n' "$health_output" >&2
  exit 1
fi

if [[ "$previous_status" == fail && "$ALERT_ON_RECOVERY" == 1 ]]; then
  recovery_message="TGM staging health recovered: $health_output"
  if ! send_alert recovery "$recovery_message"; then
    printf 'Health check passed, but recovery alert delivery failed.\n' >&2
    exit 1
  fi
fi

printf '%s\n' "$health_output"
exit 0
