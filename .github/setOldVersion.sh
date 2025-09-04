#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <new-version>" >&2
  exit 0
fi

pkg="package.json"
if [[ ! -f "$pkg" ]]; then
  echo "Error: $pkg not found in current directory." >&2
  exit 1
fi

new_version="$1"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

jq --arg v "$new_version" '.version = $v' "$pkg" > "$tmp_file"
mv "$tmp_file" "$pkg"
trap - EXIT
