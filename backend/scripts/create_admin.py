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
    ("water.supply", "Water Supply"),
    ("electricity", "Electricity"),
    ("roads.transport", "Roads & Transport"),
    ("sanitation", "Sanitation"),
    ("public.health", "Public Health"),
    ("police.law", "Police / Law & Order"),
    ("public.transport", "Public Transport"),
    ("education", "Education"),
    ("housing.urban", "Housing & Urban Development"),
    ("environment.forestry", "Environment & Forestry"),
    ("social.welfare", "Social Welfare & Pensions"),
    ("general.administration", "General Administration"),
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
        for email_prefix, department in STAFF_ACCOUNTS:
            accounts.extend([
                (f"{email_prefix}.officer@government.gov.in", department, f"{department} Officer", "department officer"),
                (f"{email_prefix}.field@government.gov.in", department, f"{department} Field Inspector", "staff"),
                (f"{email_prefix}.policy@government.gov.in", department, f"{department} Policymaker", "policymaker"),
            ])

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
