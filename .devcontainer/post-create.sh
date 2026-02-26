#!/bin/bash
set -e

echo "==> Installing Flutter dependencies..."
cd /workspace/apps/admin_app && flutter pub get
cd /workspace/apps/technician_app && flutter pub get

echo "==> Running Flutter code generation for admin_app..."
cd /workspace/apps/admin_app && flutter pub run build_runner build --delete-conflicting-outputs

echo "==> Installing Python backend dependencies..."
cd /workspace/backend && pip3 install --user -r requirements.txt

echo "==> Copying .env for backend..."
if [ ! -f /workspace/backend/.env ]; then
  cp /workspace/backend/.env.example /workspace/backend/.env
  echo "  Created backend/.env from .env.example — update credentials as needed."
fi

echo ""
echo "✓ Dev environment ready!"
echo ""
echo "Useful commands:"
echo "  Backend   : cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  Admin web : cd apps/admin_app && flutter run -d web-server --web-port 4000 --web-hostname 0.0.0.0"
echo "  Tech web  : cd apps/technician_app && flutter run -d web-server --web-port 4001 --web-hostname 0.0.0.0"
