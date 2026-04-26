set quiet

port := env("AEM_PORT", "3000")
studio_port := env("STUDIO_PORT", "3100")
wc_port := env("WC_PORT", "3200")

default:
    @just --list

install:
    cd web-components && npm install
    cd studio && npm install

start:
    cd studio && PORT={{studio_port}} node ./proxy-server.mjs &
    cd web-components && DEV_SERVER_PORT={{wc_port}} node ./watch.mjs --serve &
    aem up --port {{port}} &

stop:
    -lsof -ti:{{port}} | xargs kill -9 2>/dev/null
    -lsof -ti:{{studio_port}} | xargs kill -9 2>/dev/null
    -lsof -ti:{{wc_port}} | xargs kill -9 2>/dev/null

health:
    @curl -sf http://localhost:{{port}} > /dev/null 2>&1 && echo "UP ({{port}})" || echo "DOWN ({{port}})"

test:
    cd web-components && npm run test:ci
    cd studio && npm run test:ci