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


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"User already exists: {ADMIN_EMAIL}")
        else:
            user = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name=ADMIN_NAME,
                role="admin",
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print(f"Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
