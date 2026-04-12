#!/bin/sh

set -eu

export CI=true

LOCKFILE="/app/pnpm-lock.yaml"
STAMP="/app/node_modules/.install-stamp"

echo "[frontend] Checking dependencies..."

if [ ! -f "$LOCKFILE" ]; then
  echo "[frontend] Missing pnpm-lock.yaml"
  exit 1
fi

CURRENT_HASH="$(md5sum "$LOCKFILE" | awk '{print $1}')"
STAMP_HASH="$(cat "$STAMP" 2>/dev/null || true)"

if [ ! -d /app/node_modules ] || [ "$CURRENT_HASH" != "$STAMP_HASH" ]; then
  echo "[frontend] Installing dependencies..."
  pnpm install --frozen-lockfile --prefer-offline
  printf '%s' "$CURRENT_HASH" > "$STAMP"
  echo "[frontend] Dependencies ready."
else
  echo "[frontend] Dependencies already in sync."
fi

echo "[frontend] Starting: $*"
exec "$@"
