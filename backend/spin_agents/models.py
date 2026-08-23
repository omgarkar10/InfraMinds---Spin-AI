import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from spin_agents.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(50), default="citizen") # citizen, staff, admin, etc.
    department = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
