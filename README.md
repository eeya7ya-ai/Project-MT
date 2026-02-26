# Project-MT

Full-stack field project management system with Admin app (Flutter desktop+mobile),
Technician mobile app (Flutter + offline SQLite), and FastAPI backend on PostgreSQL.

---

## Architecture

```
Project-MT/
├── database/
│   └── schema.sql              # PostgreSQL DDL (all tables + triggers)
├── backend/                    # FastAPI (Python) REST API
│   ├── app/
│   │   ├── core/               # config, database, security (JWT)
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── api/                # Route handlers
│   │   │   ├── auth.py         # Login, refresh, user management
│   │   │   ├── clients.py      # Client CRUD
│   │   │   ├── projects.py     # Project CRUD
│   │   │   ├── assignments.py  # Assign technicians to projects
│   │   │   ├── modules.py      # All 5 module types + items CRUD
│   │   │   ├── excel_import.py # Upload .xlsx -> parse -> create items
│   │   │   ├── attachments.py  # File upload/download
│   │   │   └── technician.py   # My projects, schedule, offline sync
│   │   └── utils/
│   │       └── excel_parser.py # openpyxl column mapping logic
│   ├── requirements.txt
│   └── Dockerfile
├── apps/
│   ├── admin_app/              # Flutter Admin + Dispatcher (desktop + mobile)
│   └── technician_app/         # Flutter Technician (mobile + offline SQLite)
├── nginx/nginx.conf
└── docker-compose.yml
```

---

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| clients | Customer/client records |
| users | All users (admin / dispatcher / technician) |
| projects | Projects linked to clients |
| project_assignments | Which technicians are assigned to which projects |
| attachments | Files, photos, documents linked to any entity |
| refresh_tokens | JWT refresh token store |

### Module Tables (each is completely separate)
| Module | Module Table | Items Table |
|--------|-------------|-------------|
| Survey | survey_modules | survey_items |
| Maintenance | maintenance_modules | maintenance_items |
| Installation | installation_modules | installation_items |
| Programming & Handover | programming_handover_modules | programming_handover_items |
| Handover / Files | handover_modules | handover_required_files |

---

## API Endpoints Summary

### Auth: /api/v1/auth/
- POST login, POST refresh, POST logout
- GET/PATCH me, GET/POST/PATCH/DELETE users (admin)

### Projects: /api/v1/projects/
- GET list, POST create, GET detail, PATCH update, DELETE

### Assignments: /api/v1/projects/:id/assignments/
- GET list, POST assign, PATCH status, DELETE remove

### Modules (per project):
- POST/GET /projects/:id/survey
- POST/GET /projects/:id/maintenance  (multiple allowed)
- POST/GET /projects/:id/installation (multiple allowed)
- POST/GET /projects/:id/programming-handover (multiple allowed)
- POST/GET /projects/:id/handover
- PATCH /{module-type}/:module_id

### Items (per module):
- POST /{module-type}/:module_id/items
- PATCH /{module-type}/items/:item_id
- DELETE /{module-type}/items/:item_id

### Excel Import: /api/v1/import/
- POST preview (get headers + sample)
- POST /{module-type}/:module_id (upload + column_map JSON)

### Attachments: /api/v1/attachments/
- POST upload, GET list, DELETE, GET serve file

### Technician: /api/v1/technician/
- GET my-projects, GET my-schedule
- GET sync/:project_id (full offline snapshot)

---

## Quick Start

```bash
# 1. Start services
cp backend/.env.example backend/.env
docker-compose up -d db api

# 2. API docs
open http://localhost:8000/docs
```

Default admin: admin@projectmt.com / Admin@1234

### Flutter Apps
```bash
# Admin app (desktop/mobile)
cd apps/admin_app && flutter pub get && flutter run

# Technician app (mobile)
cd apps/technician_app && flutter pub get && flutter run
```

Update baseUrl in lib/core/constants.dart to your server IP.

---

## Security Model

| Role | Access |
|------|--------|
| admin | Full access |
| dispatcher | Projects, assignments, all modules |
| technician | ONLY their assigned projects + modules |

- JWT access tokens: 60 min, refresh tokens: 30 days (rotating)
- Server-side enforcement on every endpoint

## Offline Mode (Technician App)
1. Login syncs all assigned project data to local SQLite
2. Status updates while offline are queued locally
3. Sync button (or auto on reconnect) pushes changes to server
4. Offline banner shown when no connectivity detected
