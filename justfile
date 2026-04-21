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
