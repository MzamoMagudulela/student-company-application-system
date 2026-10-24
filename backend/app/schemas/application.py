from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.enums import ApplicationStatus, OfferStatus
from backend.app.schemas.opportunity import OpportunityOut

class StatusHistoryOut(BaseModel):
    id: int
    from_status: Optional[ApplicationStatus] = None
    to_status: ApplicationStatus
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class OfferOut(BaseModel):
    id: int
    offer_reference: str
    issue_date: datetime
    response_deadline: datetime
    start_date: Optional[datetime] = None
    terms_and_conditions: str
    status: OfferStatus
    notes: Optional[str] = None
    responded_at: Optional[datetime] = None
    has_pdf: bool = True

    class Config:
        from_attributes = True

class ApplicationSubmit(BaseModel):
    opportunity_id: int
    submitted_cv_id: Optional[int] = None
    cover_letter: Optional[str] = None
    question_responses: Dict[str, Any] = {}
    declaration_accepted: bool = Field(..., description="Confirmation of accuracy and terms")

class ApplicationStatusUpdate(BaseModel):
    new_status: ApplicationStatus
    notes: Optional[str] = None

class ApplicationNoteCreate(BaseModel):
    note_text: str
    is_internal: bool = True

class ApplicationNoteOut(BaseModel):
    id: int
    note_text: str
    is_internal: bool
    author_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: int
    reference_number: str
    student_id: int
    opportunity_id: int
    status: ApplicationStatus
    submitted_cv_id: Optional[int] = None
    cover_letter: Optional[str] = None
    question_responses: Dict[str, Any] = {}
    submitted_at: datetime
    updated_at: datetime
    opportunity: Optional[OpportunityOut] = None
    status_history: List[StatusHistoryOut] = []
    offer: Optional[OfferOut] = None

    class Config:
        from_attributes = True
