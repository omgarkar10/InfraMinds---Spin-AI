import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spin_agents.db import AsyncSessionLocal, engine, Base
from spin_agents.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Check if already exists
        from sqlalchemy import select
        stmt = select(User).where(User.email == "admin@government.gov.in")
        result = await db.execute(stmt)
        existing = result.scalars().first()
        
        if existing:
            print("Admin already exists!")
            return

        user = User(
            email="admin@government.gov.in",
            password_hash=pwd_context.hash("SecureSPIN2026!"),
            name="System Administrator",
            department="IT Operations",
            role="admin",
            is_verified=True
        )
        db.add(user)
        await db.commit()
        print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(create_admin())
