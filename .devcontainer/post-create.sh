#!/bin/bash
set -e

echo "==> Flutter pub get for admin_app..."
cd /workspace/apps/admin_app && flutter pub get

echo "==> Flutter pub get for technician_app..."
cd /workspace/apps/technician_app && flutter pub get

echo "==> Copying backend .env..."
if [ ! -f /workspace/backend/.env ]; then
  cp /workspace/backend/.env.example /workspace/backend/.env
  echo "  Created backend/.env — update credentials as needed."
fi

echo ""
echo "Dev environment ready!"
echo ""
echo "  Backend : cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  Admin   : cd apps/admin_app && flutter run -d web-server --web-port 4000 --web-hostname 0.0.0.0"
echo "  Tech    : cd apps/technician_app && flutter run -d web-server --web-port 4001 --web-hostname 0.0.0.0"
