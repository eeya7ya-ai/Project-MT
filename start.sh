#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Project-MT — quick start (no Docker needed)
# Usage: ./start.sh
# ──────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶  Starting PostgreSQL..."
service postgresql start 2>/dev/null || true
sleep 1

# Create DB + schema if first run
if ! sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw projectmt; then
  echo "▶  Creating database..."
  sudo -u postgres psql -c "CREATE DATABASE projectmt;" 2>/dev/null || true
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
  sudo -u postgres psql -d projectmt -f "$ROOT/database/schema.sql"
  echo "   ✔ Database initialised (admin@projectmt.com / Admin@1234)"
fi

# Python venv
VENV="$ROOT/.venv"
if [ ! -d "$VENV" ]; then
  echo "▶  Creating Python virtual environment..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -r "$ROOT/backend/requirements.txt" -q
fi

# Start API
echo "▶  Starting API on :8000..."
cd "$ROOT/backend"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/projectmt" \
SECRET_KEY="${SECRET_KEY:-dev-secret-key-32-bytes-long-ok!}" \
DEBUG=true \
nohup "$VENV/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 \
  > /tmp/projectmt-api.log 2>&1 &
API_PID=$!
echo "   PID $API_PID  (logs: /tmp/projectmt-api.log)"

# Wait for API
for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✔ API ready"
    break
  fi
  sleep 1
done

# npm install if needed
echo "▶  Starting Admin Web on :3000..."
cd "$ROOT/apps/admin_web"
[ ! -d node_modules ] && npm install --silent
nohup npm run dev -- --host 0.0.0.0 --port 3000 \
  > /tmp/projectmt-web.log 2>&1 &
WEB_PID=$!
echo "   PID $WEB_PID  (logs: /tmp/projectmt-web.log)"

sleep 3
echo ""
echo "══════════════════════════════════════════"
echo "  Admin Web  →  http://localhost:3000"
echo "  API        →  http://localhost:8000"
echo "  API Docs   →  http://localhost:8000/docs"
echo ""
echo "  Login:  admin@projectmt.com / Admin@1234"
echo "══════════════════════════════════════════"
