from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserSchema(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    location_id: Optional[str] = None
    age_bracket: Optional[str] = None
    is_verified_resident: bool = False
    role: str = "citizen"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileUpdate(BaseModel):
    name: str
    phone: str
    dob: str

class LocationSchema(BaseModel):
    id: str
    name: str
    parent_location_id: Optional[str] = None

class CategorySchema(BaseModel):
    id: str
    name: str

class DemandSchema(BaseModel):
    id: Optional[str] = None
    author_user_id: str
    category: str
    domain: str
    latitude: float
    longitude: float
    original_text: str
    english_translation: str
    district: Optional[str] = None
    state: Optional[str] = None
    status: str = 'gathering_support'
    vote_count: int = 1
    vote_threshold: int = 100
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status_updated_at: datetime = Field(default_factory=datetime.utcnow)

class DemandVoteSchema(BaseModel):
    id: Optional[str] = None
    demand_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
