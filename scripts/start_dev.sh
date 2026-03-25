#!/usr/bin/env bash
# Start MAS dev servers for isolated ADW worktree.
# Called by adw_test_iso.py with BACKEND_PORT and FRONTEND_PORT env vars.
# Must start servers in background and write PIDs to .dev_server.pids, then exit.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

echo "Starting MAS dev servers: proxy=$BACKEND_PORT aem=$FRONTEND_PORT"

# Start the AEM content proxy (studio/proxy-server.mjs)
PROXY_TARGET="https://author-p22655-e59433.adobeaemcloud.com"
BACKEND_PORT="$BACKEND_PORT" node "$ROOT/studio/proxy-server.mjs" "$PROXY_TARGET" \
    > "$ROOT/.dev_proxy.log" 2>&1 &
PROXY_PID=$!

# Start the AEM CLI dev server
aem up --port "$FRONTEND_PORT" --no-open \
    > "$ROOT/.dev_aem.log" 2>&1 &
AEM_PID=$!

echo "$PROXY_PID $AEM_PID" > "$ROOT/.dev_server.pids"
echo "Started proxy PID=$PROXY_PID, aem PID=$AEM_PID"

# Wait briefly to catch immediate failures
sleep 3
if ! kill -0 "$AEM_PID" 2>/dev/null; then
    echo "ERROR: aem up failed to start — check .dev_aem.log"
    exit 1
fi

echo "Dev servers running on ports $BACKEND_PORT (proxy) and $FRONTEND_PORT (aem)"
