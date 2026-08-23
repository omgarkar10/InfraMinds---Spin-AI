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
        from sqlalchemy import select

        # 1. Admin User
        stmt = select(User).where(User.email == "admin@government.gov.in")
        result = await db.execute(stmt)
        if not result.scalars().first():
            admin_user = User(
                email="admin@government.gov.in",
                password_hash=pwd_context.hash("SecureSPIN2026!"),
                name="System Administrator",
                department="Municipal Infrastructure & Public Works",
                role="admin",
                is_verified=True
            )
            db.add(admin_user)
            print("Admin user created!")
        else:
            print("Admin user already exists.")

        # 2. Ministry Officer User
        stmt_min = select(User).where(User.email == "ministry@nic.in")
        result_min = await db.execute(stmt_min)
        if not result_min.scalars().first():
            ministry_user = User(
                email="ministry@nic.in",
                password_hash=pwd_context.hash("Ministry2026!"),
                name="Dr. R. K. Sharma (Joint Secretary)",
                department="Ministry of Housing & Urban Affairs (MoHUA)",
                role="policymaker",
                is_verified=True
            )
            db.add(ministry_user)
            print("Ministry officer account created!")
        else:
            print("Ministry account already exists.")

        await db.commit()
        print("Database seed complete!")

if __name__ == "__main__":
    asyncio.run(create_admin())
