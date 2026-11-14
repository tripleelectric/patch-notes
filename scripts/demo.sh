#!/usr/bin/env bash
# Starts a fresh local patch-notes container with demo data. Usage: pnpm demo (optional DEMO_PORT, default 3000).
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=${DEMO_PORT:-3000}
URL="http://localhost:$PORT"
TOKEN=demo-publish-token-0123456789abcdef
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=demo-admin-password

docker build -q -t patch-notes:demo . >/dev/null
docker rm -f patch-notes-demo >/dev/null 2>&1 || true
docker volume rm patch-notes-demo-data >/dev/null 2>&1 || true
docker run -d --name patch-notes-demo -p "$PORT:3000" -v patch-notes-demo-data:/data \
  -e BASE_URL="$URL" -e ADMIN_EMAIL="$ADMIN_EMAIL" -e ADMIN_PASSWORD="$ADMIN_PASSWORD" -e PUBLISH_TOKEN="$TOKEN" \
  patch-notes:demo >/dev/null

for _ in $(seq 1 30); do
  curl -sf "$URL/healthz" >/dev/null && break
  sleep 1
done
curl -sf "$URL/healthz" >/dev/null || { docker logs patch-notes-demo; exit 1; }

pnpm --filter @patch-notes/cli build >/dev/null
DEMO_URL="$URL" PATCHNOTES_TOKEN="$TOKEN" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node scripts/seed-demo.mjs

cat <<INFO

patch-notes demo running at $URL
  admin     $ADMIN_EMAIL / $ADMIN_PASSWORD
  reviewer  petra@example.com / demo-review-password
  reviewer  markus@example.com / demo-review-password
Stop: docker rm -f patch-notes-demo
INFO
