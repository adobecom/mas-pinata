set quiet

port := env("AEM_PORT", "3000")
studio_port := env("STUDIO_PORT", "3100")
wc_port := env("WC_PORT", "3200")

export PATH := env("HOME") + "/.npm-global/bin:" + env("PATH")

default:
    @just --list

install:
    npm install

start:
    cd studio && PROXY_PORT={{studio_port}} npm run proxy &
    cd web-components && node ./watch.mjs --serve --port={{wc_port}} &
    aem up --port {{port}} &

stop:
    -lsof -ti:{{port}} | xargs kill -9 2>/dev/null
    -lsof -ti:{{studio_port}} | xargs kill -9 2>/dev/null
    -lsof -ti:{{wc_port}} | xargs kill -9 2>/dev/null

health:
    @curl -sf http://localhost:{{port}} > /dev/null 2>&1 && echo "UP ({{port}})" || echo "DOWN ({{port}})"

test:
    npm run test

# ---------------------------------------------------------------------------
# Piñata review-mode recipes
#
# The reviewer phase needs authenticated screenshots of mas-studio on the
# per-run Piñata port. The `mas-studio` IMS client only accepts registered
# redirect URIs (e.g. https://mas.adobe.com/studio.html), so a browser load
# of http://localhost:<pinata-port>/studio.html cannot complete IMS login.
#
# `pinata-start` boots aem up on a sibling port (10000 + AEM_PORT) and runs
# a local proxy on AEM_PORT that rewrites the imslib bootstrap in studio.html
# with a stub that reads a cached IMS token from /.pinata/auth. Token is
# populated by `pinata-auth`, which drives agent-browser through IMS login
# against the registered URL and extracts the access token + profile.
# ---------------------------------------------------------------------------

pinata-start:
    #!/usr/bin/env bash
    set -euo pipefail
    UPSTREAM=$((10000 + {{port}}))
    CACHE="${HOME}/.cache/pinata-mas/auth-cache.json"
    # Refresh auth if cache is missing OR expire timestamp is within 1 hour.
    NEEDS_AUTH=1
    if [[ -s "$CACHE" ]]; then
        NOW_MS=$(node -e 'console.log(Date.now())')
        EXPIRE_MS=$(node -e "try { console.log(JSON.parse(require('fs').readFileSync('$CACHE','utf8')).expire || 0) } catch(e) { console.log(0) }")
        # Re-auth if less than 1h (3600000ms) remains
        if (( EXPIRE_MS > NOW_MS + 3600000 )); then
            NEEDS_AUTH=0
        fi
    fi
    if (( NEEDS_AUTH == 1 )); then
        echo "[pinata-start] auth cache missing or expiring soon → running pinata-auth"
        just pinata-auth
    fi
    echo "[pinata-start] aem up on :$UPSTREAM, proxy on :{{port}} (→ :$UPSTREAM)"
    aem up --port $UPSTREAM &
    FRONTEND_PORT={{port}} AEM_UPSTREAM_PORT=$UPSTREAM node .pinata/review-proxy.mjs &

pinata-stop:
    #!/usr/bin/env bash
    UPSTREAM=$((10000 + {{port}}))
    lsof -ti:{{port}} | xargs kill -9 2>/dev/null || true
    lsof -ti:$UPSTREAM | xargs kill -9 2>/dev/null || true

# One-time IMS login (refreshes cache when expired). Drives agent-browser
# through the sign-in on https://mas.adobe.com/studio.html (a registered
# redirect_uri), extracts window.adobeIMS.getAccessToken() + getProfile(),
# and writes apps/mas/.pinata/auth-cache.json.
#
# Uses a persistent agent-browser profile so subsequent refreshes can re-use
# the IMS session cookies and skip the login form entirely.
pinata-auth:
    #!/usr/bin/env bash
    set -euo pipefail

    # Pull IMS_EMAIL / IMS_PASS from .env (tenant-local). The harness copies
    # credentials from apps/mas/.env into every worktree's .env at setup.
    if [[ -f .env ]]; then
        set -a
        source .env
        set +a
    fi
    if [[ -z "${IMS_EMAIL:-}" || -z "${IMS_PASS:-}" ]]; then
        echo "[pinata-auth] error: IMS_EMAIL and IMS_PASS must be set in .env" >&2
        exit 1
    fi
    if ! command -v agent-browser >/dev/null 2>&1; then
        echo "[pinata-auth] error: agent-browser not on PATH (npm install -g agent-browser)" >&2
        exit 1
    fi

    SESSION=pinata-mas-auth
    CACHE_DIR="${HOME}/.cache/pinata-mas-browser"
    mkdir -p "$CACHE_DIR" .pinata

    # Reuse persisted IMS cookies when available so repeated runs skip the login form.
    agent-browser open "https://mas.adobe.com/studio.html" \
        --session "$SESSION" --profile "$CACHE_DIR"

    # Wait up to 20s for either (a) the app to boot (already signed in) OR
    # (b) the IMS email input to appear (fresh login required).
    echo "[pinata-auth] waiting for IMS page or app boot..."
    if agent-browser wait --fn "(window.adobeIMS?.initialized && window.adobeIMS.isSignedInUser()) || !!document.querySelector('input[type=email], input[name=username]')" --timeout 20000 --session "$SESSION" 2>/dev/null; then
        :
    fi

    # If we need to log in, the email input is present.
    IS_SIGNED_IN=$(agent-browser eval "Boolean(window.adobeIMS?.initialized && window.adobeIMS.isSignedInUser())" --session "$SESSION" 2>/dev/null || echo "false")

    if [[ "$IS_SIGNED_IN" != "true" ]]; then
        echo "[pinata-auth] logging in as $IMS_EMAIL"
        agent-browser fill 'input[type=email], input[name=username]' "$IMS_EMAIL" --session "$SESSION"
        agent-browser click 'button[type=submit], text=Continue' --session "$SESSION"
        # Wait for password field to appear
        agent-browser wait 'input[type=password], input[name=password]' --timeout 15000 --session "$SESSION"
        agent-browser fill 'input[type=password], input[name=password]' "$IMS_PASS" --session "$SESSION"
        agent-browser click 'button[type=submit], text=Continue' --session "$SESSION"
        # Wait for return to mas.adobe.com studio app
        echo "[pinata-auth] waiting for IMS callback → mas.adobe.com..."
        agent-browser wait --fn "window.adobeIMS?.initialized && window.adobeIMS.isSignedInUser()" --timeout 30000 --session "$SESSION"
    else
        echo "[pinata-auth] IMS session already valid — skipping login"
    fi

    # Kick off async profile fetch and wait for it to resolve on window.
    agent-browser eval "window.adobeIMS.getProfile().then(p => { window._pinataProfile = p; }).catch(e => { window._pinataProfileError = String(e); })" --session "$SESSION" >/dev/null
    agent-browser wait --fn "window._pinataProfile !== undefined || window._pinataProfileError !== undefined" --timeout 15000 --session "$SESSION"

    # Extract token + profile synchronously.
    RAW=$(agent-browser eval "JSON.stringify({
        token: window.adobeIMS.getAccessToken().token,
        profile: window._pinataProfile || null,
        expire: (window.adobeIMS.getAccessToken().expire?.valueOf?.() || (Date.now() + 3600000))
    })" --session "$SESSION")

    # agent-browser eval returns the result as its stdout. Some versions wrap
    # strings in extra quotes; strip one layer if present and validate JSON.
    if [[ "$RAW" == \"*\" ]]; then
        RAW="${RAW:1:-1}"
        RAW="${RAW//\\\"/\"}"
    fi

    # Sanity-check: must be a JSON object with a non-empty token.
    if ! echo "$RAW" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!d.token) process.exit(1)" 2>/dev/null; then
        echo "[pinata-auth] error: could not extract a valid IMS access token" >&2
        echo "[pinata-auth] raw eval output: $RAW" >&2
        agent-browser close --session "$SESSION" || true
        exit 1
    fi

    CACHE_FILE="${HOME}/.cache/pinata-mas/auth-cache.json"
    mkdir -p "$(dirname "$CACHE_FILE")"
    echo "$RAW" > "$CACHE_FILE"
    chmod 600 "$CACHE_FILE"
    agent-browser close --session "$SESSION" || true
    echo "[pinata-auth] wrote $CACHE_FILE"
