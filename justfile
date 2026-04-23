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
        set -a; source .env; set +a
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
    mkdir -p "$CACHE_DIR"

    # Selector helpers — agent-browser treats comma-separated CSS as one
    # selector, so we try alternates one at a time and return on first hit.
    # IMS's button text selectors (text=Continue, find role button …) don't
    # match due to nested generic/button wrappers; the data-id attributes
    # IMS renders (EmailPage-ContinueButton, PasswordPage-ContinueButton,
    # PP-PasskeyEnroll-skip-btn) are the stable hook.
    click_any() {
        local desc=$1; shift
        for sel in "$@"; do
            if agent-browser click "$sel" --session "$SESSION" 2>&1 | grep -q '^✓'; then
                return 0
            fi
        done
        echo "[pinata-auth] could not click $desc (tried: $*)" >&2
        return 1
    }
    fill_any() {
        local desc=$1 value=$2; shift 2
        for sel in "$@"; do
            if agent-browser fill "$sel" "$value" --session "$SESSION" 2>&1 | grep -q '^✓'; then
                return 0
            fi
        done
        echo "[pinata-auth] could not fill $desc" >&2
        return 1
    }
    is_signed_in() {
        local s
        s=$(agent-browser eval "Boolean(window.adobeIMS?.initialized && window.adobeIMS.isSignedInUser())" --session "$SESSION" 2>/dev/null | tail -1)
        [[ "$s" == "true" ]]
    }

    # Persistent profile = IMS cookies survive across runs so repeated calls
    # skip the login form entirely.
    agent-browser open "https://mas.adobe.com/studio.html" \
        --session "$SESSION" --profile "$CACHE_DIR" >/dev/null

    # Wait up to 20s for one of: app boot, email input, password input.
    echo "[pinata-auth] waiting for IMS page or app boot..."
    agent-browser wait --fn "
        (window.adobeIMS?.initialized && window.adobeIMS.isSignedInUser()) ||
        !!document.querySelector('input[name=username]') ||
        !!document.querySelector('input[name=password]')
    " --timeout 20000 --session "$SESSION" 2>/dev/null || true

    if ! is_signed_in; then
        echo "[pinata-auth] logging in as $IMS_EMAIL"

        # Email step — skip if the email input isn't on the page (e.g. we
        # already progressed via cookie to the password page).
        if agent-browser get box 'input[name=username]' --session "$SESSION" 2>&1 | grep -q '^x:'; then
            fill_any "email" "$IMS_EMAIL" 'input[name=username]'
            click_any "email Continue" \
                '[data-id="EmailPage-ContinueButton"]' \
                '[data-id="EmailPageV2-ContinueButton"]' \
                'form button[type=submit]'
        fi

        # Password step.
        agent-browser wait 'input[name=password]' --timeout 15000 --session "$SESSION" >/dev/null
        fill_any "password" "$IMS_PASS" 'input[name=password]' '#PasswordPage-PasswordField'
        click_any "password Continue" \
            '[data-id="PasswordPage-ContinueButton"]' \
            'form button[type=submit]'

        # Post-login: poll up to 30s for signed-in state, skipping any
        # interstitials (passkey enrollment, two-factor opt-in, …) along the
        # way. All Adobe progressive-profile screens share the `PP-` data-id
        # prefix and a `-skip-btn` suffix.
        echo "[pinata-auth] handling post-login interstitials..."
        for _ in $(seq 1 30); do
            if is_signed_in; then break; fi
            # Try known skip buttons — silent on miss.
            for sel in '[data-id="PP-PasskeyEnroll-skip-btn"]' \
                       '[data-id^="PP-"][data-id$="-skip-btn"]'; do
                if agent-browser click "$sel" --session "$SESSION" >/dev/null 2>&1; then
                    echo "[pinata-auth] skipped interstitial: $sel"
                fi
            done
            sleep 1
        done

        if ! is_signed_in; then
            echo "[pinata-auth] login did not complete — current URL:" >&2
            agent-browser get url --session "$SESSION" >&2 || true
            agent-browser close --session "$SESSION" >/dev/null 2>&1 || true
            exit 1
        fi
    else
        echo "[pinata-auth] IMS session already valid — skipping login"
    fi

    # Extract token + profile. getProfile() is async, so stash on window and
    # poll before synchronously pulling everything out.
    agent-browser eval "window.adobeIMS.getProfile().then(p => { window._pinataProfile = p; }).catch(e => { window._pinataProfileError = String(e); })" --session "$SESSION" >/dev/null
    agent-browser wait --fn "window._pinataProfile !== undefined || window._pinataProfileError !== undefined" --timeout 15000 --session "$SESSION" >/dev/null

    RAW=$(agent-browser eval "JSON.stringify({
        token: window.adobeIMS.getAccessToken().token,
        profile: window._pinataProfile || null,
        expire: (window.adobeIMS.getAccessToken().expire?.valueOf?.() || (Date.now() + 3600000))
    })" --session "$SESSION" 2>&1 | tail -1)

    CACHE_FILE="${HOME}/.cache/pinata-mas/auth-cache.json"
    mkdir -p "$(dirname "$CACHE_FILE")"

    # agent-browser eval returns the result as a JSON-encoded string (outer
    # quotes, inner quotes escaped). Unwrap with node rather than fragile
    # bash substring ops (macOS ships bash 3.2 which lacks :-1 slicing).
    # Node also validates that the inner payload has a non-empty token and
    # writes the cache in one step — failure anywhere exits non-zero.
    if ! printf '%s' "$RAW" | node -e "
        const raw = require('fs').readFileSync(0, 'utf8').trim();
        let inner = raw;
        try { const parsed = JSON.parse(raw); if (typeof parsed === 'string') inner = parsed; } catch {}
        let d;
        try { d = JSON.parse(inner); } catch (e) { console.error('[pinata-auth] not JSON after unwrap:', e.message); process.exit(1); }
        if (!d || !d.token) { console.error('[pinata-auth] unwrapped payload has no token'); process.exit(1); }
        require('fs').writeFileSync('$CACHE_FILE', JSON.stringify(d));
    "; then
        echo "[pinata-auth] error: could not extract a valid IMS access token" >&2
        echo "[pinata-auth] raw eval output: $RAW" >&2
        agent-browser close --session "$SESSION" >/dev/null 2>&1 || true
        exit 1
    fi

    chmod 600 "$CACHE_FILE"
    agent-browser close --session "$SESSION" >/dev/null 2>&1 || true
    echo "[pinata-auth] wrote $CACHE_FILE"
