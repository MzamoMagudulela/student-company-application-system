from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.enums import UserRole, AccountStatus, OfferStatus, RecoveryStatus
from backend.app.schemas.auth import StudentProfileOut

class AdminStudentOut(BaseModel):
    id: int
    user_id: int
    username: str
    email: str
    phone_number: Optional[str] = None
    account_status: AccountStatus
    first_name: str
    last_name: str
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    profile_completion_pct: int
    applications_count: int = 0
    created_at: datetime
    last_login_at: Optional[datetime] = None

class AdminStudentStatusUpdate(BaseModel):
    status: AccountStatus
    reason: Optional[str] = None

class IssueOfferRequest(BaseModel):
    response_deadline: datetime
    start_date: Optional[datetime] = None
    terms_and_conditions: str
    salary_stipend: Optional[str] = None
    notes: Optional[str] = None

class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_username: Optional[str] = None
    action: str
    target_entity: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminDashboardStats(BaseModel):
    total_students: int
    active_opportunities: int
    total_applications: int
    pending_reviews: int
    interviews_scheduled: int
    offers_issued: int
    offers_accepted: int
    recent_activity: List[Dict[str, Any]] = []

class RecoveryRequestOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    method: str
    identifier_used: Optional[str] = None
    status: RecoveryStatus
    notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class RecoveryRequestResolve(BaseModel):
    action: str = Field(..., description="'approve_and_generate_token' or 'reject'")
    notes: str
