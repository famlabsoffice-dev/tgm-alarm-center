#!/usr/bin/env bash
set -Eeuo pipefail

REPO="${TGM_REPO:-famlabsoffice-dev/tgm-alarm-center}"
TAG="${TGM_RELEASE_TAG:-v0.0.1}"
INSTALL_ROOT="${TGM_STAGING_ROOT:-/var/www/tgm-alarm-center-staging}"
KEEP_RELEASES="${TGM_KEEP_RELEASES:-3}"
EXPECTED_COMMIT="${TGM_EXPECTED_COMMIT:-416c98ca64028d4501b8230844deb03a8a118223}"
CURRENT_LINK="${TGM_CURRENT_LINK:-$INSTALL_ROOT/current}"
RELEASES_DIR="${TGM_RELEASES_DIR:-$INSTALL_ROOT/releases}"
DOWNLOAD_BASE="${TGM_DOWNLOAD_BASE:-https://github.com/$REPO/releases/download/$TAG}"
ROLLBACK=0

usage() {
  cat <<'USAGE'
Usage:
  deploy-staging.sh [--rollback]

Environment:
  TGM_REPO            GitHub repository, default famlabsoffice-dev/tgm-alarm-center
  TGM_RELEASE_TAG     Release tag, default v0.0.1
  TGM_STAGING_ROOT    Installation root, default /var/www/tgm-alarm-center-staging
  TGM_CURRENT_LINK    Symlink served by the web server, default $TGM_STAGING_ROOT/current
  TGM_RELEASES_DIR    Versioned release directory, default $TGM_STAGING_ROOT/releases
  TGM_EXPECTED_COMMIT Expected build-manifest sourceCommit
  TGM_KEEP_RELEASES  Number of completed releases to retain, default 3
  TGM_DOWNLOAD_BASE  Release download base URL override
USAGE
}

for argument in "$@"; do
  case "$argument" in
    --rollback) ROLLBACK=1 ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

require_command() {
  command -v "$1" >/dev/null 2>&1 || { printf 'Required command is missing: %s\n' "$1" >&2; exit 1; }
}

for command_name in curl sha256sum unzip mktemp find grep awk sort head readlink ln mv rm mkdir date; do
  require_command "$command_name"
done

if ! [[ "$KEEP_RELEASES" =~ ^[1-9][0-9]*$ ]]; then
  printf 'TGM_KEEP_RELEASES must be a positive integer.\n' >&2
  exit 2
fi

mkdir -p "$INSTALL_ROOT" "$RELEASES_DIR"

atomic_symlink() {
  local target="$1"
  local link="$2"
  local temporary="${link}.tmp.$$"
  rm -f "$temporary"
  ln -s "$target" "$temporary"
  mv -Tf "$temporary" "$link"
}

if (( ROLLBACK )); then
  if [[ ! -L "$INSTALL_ROOT/previous" ]]; then
    printf 'No previous release is available for rollback.\n' >&2
    exit 1
  fi
  previous_target=$(readlink "$INSTALL_ROOT/previous")
  [[ -d "$previous_target" ]] || { printf 'Previous release is missing: %s\n' "$previous_target" >&2; exit 1; }
  current_target=""
  if [[ -L "$CURRENT_LINK" ]]; then current_target=$(readlink "$CURRENT_LINK"); fi
  atomic_symlink "$previous_target" "$CURRENT_LINK"
  if [[ -n "$current_target" && -d "$current_target" ]]; then atomic_symlink "$current_target" "$INSTALL_ROOT/previous"; fi
  printf 'STAGING ROLLBACK PASS: %s\n' "$previous_target"
  exit 0
fi

archive_name="tgm-alarm-center-${TAG}-web.zip"
checksums_name="tgm-alarm-center-${TAG}-checksums.txt"
temporary_root=$(mktemp -d "${TMPDIR:-/tmp}/tgm-staging-deploy.XXXXXX")
cleanup() { rm -rf "$temporary_root"; }
trap cleanup EXIT

archive_path="$temporary_root/$archive_name"
checksums_path="$temporary_root/$checksums_name"
extract_path="$temporary_root/web"

curl_args=(--fail --silent --show-error --location --proto '=https' --tlsv1.2 --retry 3 --retry-delay 1)
if [[ -n "${TGM_GITHUB_TOKEN:-}" ]]; then
  curl_args+=(--header "Authorization: Bearer ${TGM_GITHUB_TOKEN}" --header 'Accept: application/octet-stream')
fi
curl "${curl_args[@]}" "$DOWNLOAD_BASE/$archive_name" --output "$archive_path"
curl "${curl_args[@]}" "$DOWNLOAD_BASE/$checksums_name" --output "$checksums_path"

expected_digest=$(awk -v filename="$archive_name" '$2 == filename { print $1; exit }' "$checksums_path")
[[ "$expected_digest" =~ ^[0-9a-fA-F]{64}$ ]] || { printf 'Checksum file does not contain a valid digest for %s.\n' "$archive_name" >&2; exit 1; }
printf '%s  %s\n' "$expected_digest" "$archive_name" > "$temporary_root/checksum-verify.txt"
(
  cd "$temporary_root"
  sha256sum -c checksum-verify.txt
)
unzip -q -t "$archive_path"
mkdir -p "$extract_path"
unzip -q "$archive_path" -d "$extract_path"

for required_file in index.html app.js styles.css sw.js manifest.webmanifest icon.png BUILD-MANIFEST.json; do
  [[ -s "$extract_path/$required_file" ]] || { printf 'Required release file is missing or empty: %s\n' "$required_file" >&2; exit 1; }
done
for required_sound in alarm-pulse.wav alarm-siren.wav alarm-chime.wav; do
  [[ -s "$extract_path/assets/notifications/$required_sound" ]] || { printf 'Required release sound is missing or empty: %s\n' "$required_sound" >&2; exit 1; }
done
manifest_commit=$(awk -F'"' '/"sourceCommit"/ { print $4; exit }' "$extract_path/BUILD-MANIFEST.json")
test "$manifest_commit" = "$EXPECTED_COMMIT" || {
  printf 'Build manifest commit mismatch: expected %s, received %s.\n' "$EXPECTED_COMMIT" "$manifest_commit" >&2
  exit 1
}

release_id="${TAG}-${EXPECTED_COMMIT:0:12}"
release_path="$RELEASES_DIR/$release_id"
mkdir -p "$release_path"
cp -a "$extract_path/." "$release_path/"
printf '%s\n' "$expected_digest" > "$release_path/RELEASE-SHA256"
printf '%s\n' "$EXPECTED_COMMIT" > "$release_path/RELEASE-COMMIT"

old_target=""
if [[ -L "$CURRENT_LINK" ]]; then old_target=$(readlink "$CURRENT_LINK"); fi
atomic_symlink "$release_path" "$CURRENT_LINK"
if [[ -n "$old_target" && "$old_target" != "$release_path" && -d "$old_target" ]]; then atomic_symlink "$old_target" "$INSTALL_ROOT/previous"; fi

mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{ $1=""; sub(/^ /, ""); print }')
if ((${#releases[@]} > KEEP_RELEASES)); then
  for stale_release in "${releases[@]:KEEP_RELEASES}"; do
    [[ "$stale_release" != "$old_target" ]] || continue
    [[ "$stale_release" != "$release_path" ]] || continue
    rm -rf -- "$stale_release"
  done
fi

printf 'STAGING DEPLOY PASS\nrelease=%s\npath=%s\ncurrent=%s\ncommit=%s\nsha256=%s\n' \
  "$TAG" "$release_path" "$(readlink "$CURRENT_LINK")" "$manifest_commit" "$expected_digest"
