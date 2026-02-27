from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.api import auth, clients, projects, assignments, modules, excel_import, attachments, technician


async def _seed_admin():
    """Upsert the default admin user on every startup.

    This guarantees the admin account always exists with the correct
    credentials, regardless of whether the DB volume is new or pre-existing.
    Override via ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME env vars.
    """
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.core.security import hash_password
    from app.models.user import User

    email    = os.getenv("ADMIN_EMAIL",    "admin@projectmt.com")
    password = os.getenv("ADMIN_PASSWORD", "Admin@1234")
    name     = os.getenv("ADMIN_NAME",     "System Administrator")

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user:
                user.password_hash = hash_password(password)
                user.is_active = True
                user.role = "admin"
            else:
                session.add(User(
                    email=email,
                    password_hash=hash_password(password),
                    full_name=name,
                    role="admin",
                    is_active=True,
                ))
            await session.commit()
            print(f"[startup] Admin ready: {email}")
        except Exception as exc:
            await session.rollback()
            print(f"[startup] Admin seed warning: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _seed_admin()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload dir exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Routers
app.include_router(auth.router,         prefix="/api/v1")
app.include_router(clients.router,      prefix="/api/v1")
app.include_router(projects.router,     prefix="/api/v1")
app.include_router(assignments.router,  prefix="/api/v1")
app.include_router(modules.router,      prefix="/api/v1")
app.include_router(excel_import.router, prefix="/api/v1")
app.include_router(attachments.router,  prefix="/api/v1")
app.include_router(technician.router,   prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
