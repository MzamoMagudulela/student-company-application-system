from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.enums import OpportunityType, LocationType

class OpportunityBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    company_name: str = Field(..., min_length=2, max_length=200)
    opportunity_type: OpportunityType = OpportunityType.INTERNSHIP
    location: str = Field(..., min_length=2, max_length=150)
    location_type: LocationType = LocationType.ON_SITE
    description: str = Field(..., min_length=10)
    requirements: str = Field(..., min_length=10)
    skills_required: List[str] = []
    official_url: Optional[str] = None
    is_external: bool = False
    closing_date: datetime
    is_active: bool = True

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    company_name: Optional[str] = None
    opportunity_type: Optional[OpportunityType] = None
    location: Optional[str] = None
    location_type: Optional[LocationType] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[List[str]] = None
    official_url: Optional[str] = None
    is_external: Optional[bool] = None
    closing_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class OpportunityOut(OpportunityBase):
    id: int
    last_verified_at: datetime
    created_at: datetime
    updated_at: datetime
    is_saved: Optional[bool] = False
    has_applied: Optional[bool] = False

    class Config:
        from_attributes = True
