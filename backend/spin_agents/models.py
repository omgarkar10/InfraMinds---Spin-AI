import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text
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

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grievance_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(255), nullable=True)
    domain = Column(String(255), nullable=True)
    category = Column(String(255), nullable=True)
    severity = Column(Integer, default=5)
    priority = Column(String(50), default="Medium")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    landmark = Column(String(255), nullable=True)
    original_text = Column(Text, nullable=True)
    english_translation = Column(Text, nullable=True)
    district = Column(String(100), default="Pune")
    state = Column(String(100), default="Maharashtra")
    status = Column(String(50), default="Submitted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

