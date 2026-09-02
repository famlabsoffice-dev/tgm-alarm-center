#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:-status}"
MIGRATION_STATE_DIR="${TGM_MIGRATION_STATE_DIR:-/var/lib/tgm-alarm-center/migrations}"
MIGRATIONS_DIR="${TGM_MIGRATIONS_DIR:-}"
BACKEND_ENABLED="${TGM_BACKEND_ENABLED:-0}"
EXPECTED_SCHEMA_VERSION="${TGM_EXPECTED_SCHEMA_VERSION:-}"
BACKUP_VERIFIED="${TGM_BACKUP_VERIFIED:-0}"
CONNECTION_VERIFIED="${TGM_CONNECTION_VERIFIED:-0}"
PERMISSIONS_VERIFIED="${TGM_PERMISSIONS_VERIFIED:-0}"
CAPACITY_VERIFIED="${TGM_CAPACITY_VERIFIED:-0}"
ADVISORY_LOCK_VERIFIED="${TGM_ADVISORY_LOCK_VERIFIED:-0}"
PREFLIGHT_APPROVED="${TGM_MIGRATION_PREFLIGHT_APPROVED:-0}"
BACKFILL_STATUS="${TGM_BACKFILL_STATUS:-pending}"
OBSERVATION_STATUS="${TGM_OBSERVATION_STATUS:-pending}"
ROLLBACK_WINDOW_EXPIRED="${TGM_ROLLBACK_WINDOW_EXPIRED:-0}"
CONTRACT_APPROVAL="${TGM_CONTRACT_APPROVAL:-}"

usage() {
  cat <<'USAGE'
Usage:
  migration-gates.sh status
  migration-gates.sh preflight
  migration-gates.sh expand
  migration-gates.sh application-deploy
  migration-gates.sh contract

The current v0.0.1 localStorage-only application uses status/preflight only.
No database command is executed by this policy gate.

Environment:
  TGM_BACKEND_ENABLED                 1 only after a server backend exists
  TGM_MIGRATION_STATE_DIR             Immutable migration receipts directory
  TGM_MIGRATIONS_DIR                  Versioned SQL migration directory
  TGM_EXPECTED_SCHEMA_VERSION         Required schema version for preflight
  TGM_BACKUP_VERIFIED                 Must be 1 for database migrations
  TGM_CONNECTION_VERIFIED             Must be 1 for database migrations
  TGM_PERMISSIONS_VERIFIED            Must be 1 for database migrations
  TGM_CAPACITY_VERIFIED               Must be 1 for database migrations
  TGM_ADVISORY_LOCK_VERIFIED          Must be 1 for database migrations
  TGM_MIGRATION_PREFLIGHT_APPROVED    Must be 1 before expand/app deployment
  TGM_BACKFILL_STATUS                 complete before contract
  TGM_OBSERVATION_STATUS              stable before contract
  TGM_ROLLBACK_WINDOW_EXPIRED         Must be 1 before contract
  TGM_CONTRACT_APPROVAL               Must be APPROVED before contract
USAGE
}

case "$MODE" in
  --help|-h) usage; exit 0 ;;
  status|preflight|expand|application-deploy|contract) ;;
  *) printf 'Unknown migration gate: %s\n' "$MODE" >&2; usage >&2; exit 2 ;;
esac

fail() { printf 'MIGRATION GATE FAIL [%s] — %s\n' "$MODE" "$1" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "required command missing: $1"; }
require_command awk
require_command find
require_command grep
require_command sha256sum

if [[ "$MODE" == status ]]; then
  if [[ "$BACKEND_ENABLED" == 1 ]]; then
    printf 'MIGRATION STATUS — backend=enabled; separate database gates required\n'
  else
    printf 'MIGRATION STATUS — backend=disabled; current localStorage-only release requires no database migration\n'
  fi
  exit 0
fi

if [[ "$BACKEND_ENABLED" != 1 ]]; then
  if [[ "$MODE" == preflight ]]; then
    printf 'MIGRATION PREFLIGHT PASS — no server-side database exists; migration not applicable\n'
    exit 0
  fi
  printf 'MIGRATION GATE BLOCKED [%s] — backend/database is not configured; no migration action permitted\n' "$MODE" >&2
  exit 2
fi

if [[ "$MODE" == preflight ]]; then
  [[ -n "$EXPECTED_SCHEMA_VERSION" ]] || fail 'TGM_EXPECTED_SCHEMA_VERSION is required'
  [[ "$BACKUP_VERIFIED" == 1 ]] || fail 'database backup is not verified'
  [[ "$CONNECTION_VERIFIED" == 1 ]] || fail 'database connection is not verified'
  [[ "$PERMISSIONS_VERIFIED" == 1 ]] || fail 'database permissions are not verified'
  [[ "$CAPACITY_VERIFIED" == 1 ]] || fail 'database capacity is not verified'
  [[ "$ADVISORY_LOCK_VERIFIED" == 1 ]] || fail 'advisory lock is not verified'
  mkdir -p "$MIGRATION_STATE_DIR"
  printf '%s\n' "$EXPECTED_SCHEMA_VERSION" > "$MIGRATION_STATE_DIR/PREFLIGHT_SCHEMA_VERSION"
  printf 'MIGRATION PREFLIGHT PASS — schema=%s backup=verified lock=verified\n' "$EXPECTED_SCHEMA_VERSION"
  exit 0
fi

[[ "$PREFLIGHT_APPROVED" == 1 ]] || fail 'migration preflight approval is required'
[[ -d "$MIGRATION_STATE_DIR" ]] || fail "migration state directory is missing: $MIGRATION_STATE_DIR"

if [[ "$MODE" == expand ]]; then
  [[ -n "$MIGRATIONS_DIR" && -d "$MIGRATIONS_DIR" ]] || fail 'TGM_MIGRATIONS_DIR must point to a versioned migration directory'
  mapfile -t migrations < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' -print | sort)
  ((${#migrations[@]} > 0)) || fail 'no versioned SQL migrations found'
  for migration in "${migrations[@]}"; do
    if grep -Eiq '(^|[^a-z])(drop[[:space:]]+(table|column|index)|alter[[:space:]]+table[^;]*(drop|rename)|rename[[:space:]]+(column|table)|alter[[:space:]]+type|set[[:space:]]+not[[:space:]]+null)([^a-z]|$)' "$migration"; then
      fail "destructive or incompatible operation found in expand migration: $migration"
    fi
  done
  : > "$MIGRATION_STATE_DIR/EXPAND_GATE_APPROVED"
  printf 'MIGRATION EXPAND PASS — %s additive migration file(s) policy-checked\n' "${#migrations[@]}"
  exit 0
fi

if [[ "$MODE" == application-deploy ]]; then
  [[ -f "$MIGRATION_STATE_DIR/EXPAND_GATE_APPROVED" ]] || fail 'expand gate has not passed'
  printf 'APPLICATION DEPLOY GATE PASS — expand schema remains compatible with old and new application versions\n'
  exit 0
fi

[[ -f "$MIGRATION_STATE_DIR/EXPAND_GATE_APPROVED" ]] || fail 'expand gate has not passed'
[[ "$BACKFILL_STATUS" == complete ]] || fail 'backfill is not complete'
[[ "$OBSERVATION_STATUS" == stable ]] || fail 'observation period is not stable'
[[ "$ROLLBACK_WINDOW_EXPIRED" == 1 ]] || fail 'rollback window has not expired'
[[ "$CONTRACT_APPROVAL" == APPROVED ]] || fail 'explicit contract approval is required'
printf 'MIGRATION CONTRACT PASS — destructive cleanup is authorized in a separate release\n'
