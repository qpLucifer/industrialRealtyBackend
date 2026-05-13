#!/usr/bin/env bash
set -euo pipefail

# Required env:
# APP_DIR        - project directory on server, e.g. /www/wwwroot/industrial-realty-hifi/admin-web
# DEPLOY_BRANCH  - git branch to deploy, e.g. main
# PUBLIC_DIR     - web root served by Nginx in BT, e.g. /www/wwwroot/admin-web-test

: "${APP_DIR:?APP_DIR is required}"
: "${DEPLOY_BRANCH:?DEPLOY_BRANCH is required}"
: "${PUBLIC_DIR:?PUBLIC_DIR is required}"

echo "[admin-web] deploy start"
echo "[admin-web] APP_DIR=${APP_DIR}"
echo "[admin-web] DEPLOY_BRANCH=${DEPLOY_BRANCH}"
echo "[admin-web] PUBLIC_DIR=${PUBLIC_DIR}"

cd "${APP_DIR}"

git fetch --all --prune
git checkout "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

npm ci
npm run build

mkdir -p "${PUBLIC_DIR}"
rsync -av --delete dist/ "${PUBLIC_DIR}/"

echo "[admin-web] deploy done"
