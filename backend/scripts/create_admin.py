import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from spin_agents.db import AsyncSessionLocal, engine, Base
from spin_agents.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SHARED_PASSWORD = "SecureSPIN2026!"

STAFF_ACCOUNTS = [
    ("water.supply@government.gov.in", "Water Supply", "Water Supply Officer"),
    ("electricity@government.gov.in", "Electricity", "Electricity Officer"),
    ("roads.transport@government.gov.in", "Roads & Transport", "Roads & Transport Officer"),
    ("sanitation@government.gov.in", "Sanitation", "Sanitation Officer"),
    ("public.health@government.gov.in", "Public Health", "Public Health Officer"),
    ("police.law@government.gov.in", "Police / Law & Order", "Police / Law & Order Officer"),
    ("public.transport@government.gov.in", "Public Transport", "Public Transport Officer"),
    ("education@government.gov.in", "Education", "Education Officer"),
    ("housing.urban@government.gov.in", "Housing & Urban Development", "Housing & Urban Development Officer"),
    ("environment.forestry@government.gov.in", "Environment & Forestry", "Environment & Forestry Officer"),
    ("social.welfare@government.gov.in", "Social Welfare & Pensions", "Social Welfare & Pensions Officer"),
    ("general.administration@government.gov.in", "General Administration", "General Administration Officer"),
]

async def create_admin():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # Hash once and reuse it for every seeded account.
        password_hash = pwd_context.hash(SHARED_PASSWORD)
        accounts = [
            ("admin@government.gov.in", "General Administration", "System Administrator", "admin"),
            ("ministry@nic.in", "Ministry of Housing & Urban Affairs (MoHUA)", "Dr. R. K. Sharma (Joint Secretary)", "policymaker"),
        ]
        accounts.extend((email, department, name, "department officer") for email, department, name in STAFF_ACCOUNTS)

        for email, department, name, role in accounts:
            stmt = select(User).where(User.email == email)
            user = (await db.execute(stmt)).scalars().first()
            if user:
                user.password_hash = password_hash
                user.department = department
                user.name = name
                user.role = role
                user.is_verified = True
                print(f"Updated: {email}")
            else:
                db.add(User(
                    email=email,
                    password_hash=password_hash,
                    name=name,
                    department=department,
                    role=role,
                    is_verified=True,
                ))
                print(f"Created: {email}")

        await db.commit()
        print("Database seed complete!")

if __name__ == "__main__":
    asyncio.run(create_admin())
