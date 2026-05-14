#!/usr/bin/env bash
set -euo pipefail

# Required env:
# APP_DIR        - project directory on server, e.g. /www/wwwroot/industrial-realty-hifi/admin-web
# DEPLOY_BRANCH  - git branch to deploy, e.g. main
# PUBLIC_DIR     - web root served by Nginx in BT, e.g. /www/wwwroot/admin-web-test
# Optional: SERVER_DOTENV_B64 - base64 of admin-web/.env (GitHub Actions); Vite bakes VITE_* at build time only.

: "${APP_DIR:?APP_DIR is required}"
: "${DEPLOY_BRANCH:?DEPLOY_BRANCH is required}"
: "${PUBLIC_DIR:?PUBLIC_DIR is required}"

echo "[admin-web] deploy start"
echo "[admin-web] APP_DIR=${APP_DIR}"
echo "[admin-web] DEPLOY_BRANCH=${DEPLOY_BRANCH}"
echo "[admin-web] PUBLIC_DIR=${PUBLIC_DIR}"
if [ -n "${SERVER_DOTENV_B64:-}" ]; then
  echo "[admin-web] SERVER_DOTENV_B64 is set (length ${#SERVER_DOTENV_B64} chars)"
else
  echo "[admin-web] SERVER_DOTENV_B64 is NOT set — build will use committed .env (if any) or missing VITE_*"
fi

cd "${APP_DIR}"

git fetch --all --prune
git checkout "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

# Optional: GitHub Actions secret SERVER_DOTENV_B64 = base64 of admin-web/.env (Vite reads VITE_* at build time).
# Create (Linux):  cd admin-web && printf '%s' "$(cat .env)" | base64 -w0
# macOS:           printf '%s' "$(cat .env)" | base64 | tr -d '\n'
if [ -n "${SERVER_DOTENV_B64:-}" ]; then
  printf '%s' "$SERVER_DOTENV_B64" | base64 -d | sed '1s/^\xEF\xBB\xBF//' > .env || {
    echo "[admin-web] ERROR: base64 -d failed (wrong secret format? use raw base64 only, no data: prefix)" >&2
    exit 1
  }
  echo "[admin-web] wrote .env from SERVER_DOTENV_B64"
fi

# Vite only embeds VITE_* at npm run build — production site root does not need .env after rsync.
if [ -f .env ]; then
  if grep -qE '^[[:space:]]*VITE_AMAP_WEB_KEY[[:space:]]*=[[:space:]]*[^[:space:]]' .env; then
    echo "[admin-web] .env: VITE_AMAP_WEB_KEY is non-empty"
  else
    echo "[admin-web] WARN: .env has empty or missing VITE_AMAP_WEB_KEY — map search will fail" >&2
  fi
  if grep -qE '^[[:space:]]*VITE_AMAP_SECURITY_JS_CODE[[:space:]]*=[[:space:]]*[^[:space:]]' .env; then
    echo "[admin-web] .env: VITE_AMAP_SECURITY_JS_CODE is non-empty (required for keys created after 2021-12-02)"
  else
    echo "[admin-web] WARN: .env has empty or missing VITE_AMAP_SECURITY_JS_CODE — PlaceSearch often returns error" >&2
  fi
else
  echo "[admin-web] WARN: no .env in APP_DIR before build — ensure SERVER_DOTENV_B64 or server-side .env" >&2
fi

npm ci
npm run build

mkdir -p "${PUBLIC_DIR}"
rsync -av --delete dist/ "${PUBLIC_DIR}/"

echo "[admin-web] deploy done"
