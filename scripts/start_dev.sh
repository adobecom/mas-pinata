#!/usr/bin/env bash
# start_dev.sh — Start dev servers for the mas app.
#
# Called by adw_test_iso.py with BACKEND_PORT and FRONTEND_PORT env vars.
#
# BACKEND_PORT: custom Node proxy that serves local files + proxies to AEM CDN.
#   Replaces `aem up` to avoid the 63-char DNS label limit that AEM CLI
#   enforces (feat-24-price-based-sort-merch-card-collection--mas--adobe-ai-pod
#   = 65 chars).
#
# FRONTEND_PORT: web-components watcher (rebuild on source change).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-9110}"
PIDS_FILE="$ROOT_DIR/.dev_server.pids"

mkdir -p "$ROOT_DIR/logs"

# --- Start custom AEM-compatible dev server on BACKEND_PORT ---
BACKEND_PORT="$BACKEND_PORT" node "$ROOT_DIR/scripts/dev-server.mjs" \
    > "$ROOT_DIR/logs/aem.log" 2>&1 &
BACKEND_PID=$!
echo "[start_dev] Dev server started (PID $BACKEND_PID) → http://localhost:$BACKEND_PORT"

# --- Start web-components watcher (build on source change) ---
cd "$ROOT_DIR/web-components"
node ./watch.mjs > "$ROOT_DIR/logs/wc.log" 2>&1 &
WC_PID=$!
echo "[start_dev] Web-components watcher started (PID $WC_PID)"

# --- Write PIDs for stop_dev_server cleanup ---
echo "$BACKEND_PID $WC_PID" > "$PIDS_FILE"

# --- Wait for dev server to be ready (up to 15s) ---
echo "[start_dev] Waiting for dev server on port $BACKEND_PORT..."
for i in $(seq 1 15); do
    if lsof -ti:"$BACKEND_PORT" >/dev/null 2>&1; then
        echo "[start_dev] Dev server ready on port $BACKEND_PORT"
        exit 0
    fi
    sleep 1
done

echo "[start_dev] ERROR: Dev server did not bind port $BACKEND_PORT after 15s"
tail -10 "$ROOT_DIR/logs/aem.log" >&2
kill "$BACKEND_PID" 2>/dev/null || true
kill "$WC_PID" 2>/dev/null || true
exit 1
