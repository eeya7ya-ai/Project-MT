#!/usr/bin/env python3
"""
Seed the database with an initial admin user.
Run from the /backend directory:
    python seed_admin.py
Or with custom credentials:
    ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret python seed_admin.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@projectmt.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@1234")
ADMIN_NAME     = os.getenv("ADMIN_NAME",     "System Administrator")

# Additional seeded admins that are always created
SEEDED_ADMINS = [
    {"email": "eeya7ya@gmail.com", "full_name": "Admin", "password": "Admin@1234"},
]


async def ensure_user(session: AsyncSession, email: str, full_name: str, password: str):
    result = await session.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        print(f"User already exists: {email}")
    else:
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="admin",
            is_active=True,
        )
        session.add(user)
        print(f"Admin user created: {email}")


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        await ensure_user(session, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD)
        for admin in SEEDED_ADMINS:
            await ensure_user(session, admin["email"], admin["full_name"], admin["password"])
        await session.commit()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
