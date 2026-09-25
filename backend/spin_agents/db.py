

from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from spin_agents.config import CONFIG

DATABASE_URL = CONFIG.database_url

# Configure connection engine options depending on database driver
engine_kwargs: Dict[str, Any] = {"echo": False}
if DATABASE_URL.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    })

engine = create_async_engine(DATABASE_URL, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()



async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
