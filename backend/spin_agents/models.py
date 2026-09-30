from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

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
    department_id: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    assigned_wards: List[str] = Field(default_factory=list)
    status: str = "active"
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
    author_name: Optional[str] = "Anonymous Citizen"
    category: str
    domain: str
    latitude: float
    longitude: float
    original_text: str
    english_translation: str
    district: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    request_type: str = "maintenance"
    reason: Optional[str] = None
    intended_beneficiaries: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    status: str = 'gathering_support'
    vote_count: int = 0
    vote_threshold: int = 100
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status_updated_at: datetime = Field(default_factory=datetime.utcnow)

class DemandVoteSchema(BaseModel):
    id: Optional[str] = None
    demand_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
