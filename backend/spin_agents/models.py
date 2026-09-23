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
    request_type = Column(String(50), default="existing_problem", nullable=False)  # "existing_problem" or "new_development"
    domain = Column(String(255), nullable=True)
    category = Column(String(255), nullable=True)
    specific_issue = Column(String(255), nullable=True)
    severity = Column(Integer, default=5)
    priority = Column(String(50), default="Medium")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    landmark = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    district = Column(String(100), nullable=True)      # Never silently defaulted to Pune
    state = Column(String(100), nullable=True)         # Never silently defaulted to Maharashtra
    pincode = Column(String(20), nullable=True)
    original_text = Column(Text, nullable=True)
    english_translation = Column(Text, nullable=True)
    source_language = Column(String(20), default="auto", nullable=True)
    # Type A fields (Existing Infrastructure Problem)
    start_date = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    # Type B fields (New Infrastructure Development Request)
    reason = Column(Text, nullable=True)
    intended_beneficiaries = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    evidence_urls = Column(Text, nullable=True)
    status = Column(String(50), default="Submitted")
    bigquery_synced = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

