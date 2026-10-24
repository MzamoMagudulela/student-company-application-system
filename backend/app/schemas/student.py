from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class StudentProfileBase(BaseModel):
    first_name: str
    last_name: str
    headline: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    profile_completion_pct: int = 20

class StudentProfileOut(StudentProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    headline: Optional[str] = Field(None, max_length=200)
    field_of_study: Optional[str] = Field(None, max_length=150)
    institution: Optional[str] = Field(None, max_length=200)
    graduation_year: Optional[str] = Field(None, max_length=10)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=150)
    skills: Optional[List[str]] = None

class CVDocumentOut(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    is_primary: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True

class CVAnalysisOut(BaseModel):
    id: int
    score: int
    checklist_results: Dict[str, Any]
    missing_sections: List[str]
    strengths: List[str]
    recommendations: List[str]
    analyzed_at: datetime

    class Config:
        from_attributes = True

class DashboardStatsOut(BaseModel):
    profile_completion_pct: int
    cv_readiness_score: int
    applications_submitted: int
    applications_under_review: int
    shortlisted_count: int
    offers_received: int
    saved_opportunities_count: int
    learning_modules_completed: int
    unread_notifications_count: int
