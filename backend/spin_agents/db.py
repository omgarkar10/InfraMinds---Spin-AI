from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./spin.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import text

async def init_db():
    """
    Initializes tables and applies safe, idempotent column migrations.
    Never drops or resets existing databases or tables.
    """
    async with engine.begin() as conn:
        # Create any missing tables
        await conn.run_sync(Base.metadata.create_all)

        # For SQLite, check if existing table needs new columns added
        def _migrate_sqlite_schema(sync_conn):
            check_table = sync_conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='grievances'")
            ).fetchone()
            if check_table:
                cols_result = sync_conn.execute(text("PRAGMA table_info(grievances)")).fetchall()
                existing_cols = {row[1] for row in cols_result}
                column_defs = [
                    ("request_type", "VARCHAR(50) DEFAULT 'existing_problem'"),
                    ("specific_issue", "VARCHAR(255)"),
                    ("address", "TEXT"),
                    ("pincode", "VARCHAR(20)"),
                    ("source_language", "VARCHAR(20) DEFAULT 'auto'"),
                    ("start_date", "VARCHAR(100)"),
                    ("frequency", "VARCHAR(100)"),
                    ("reason", "TEXT"),
                    ("intended_beneficiaries", "VARCHAR(255)"),
                    ("confidence", "FLOAT"),
                    ("evidence_urls", "TEXT"),
                    ("bigquery_synced", "BOOLEAN DEFAULT 0"),
                ]
                for col_name, col_sql in column_defs:
                    if col_name not in existing_cols:
                        sync_conn.execute(text(f"ALTER TABLE grievances ADD COLUMN {col_name} {col_sql}"))

        if "sqlite" in DATABASE_URL:
            await conn.run_sync(_migrate_sqlite_schema)

