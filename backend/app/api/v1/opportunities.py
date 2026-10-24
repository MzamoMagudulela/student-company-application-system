from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.core.database import get_db
from backend.app.core.security import hash_token
from backend.app.models.entities import Opportunity, SavedOpportunity, Application, User, StudentProfile, Session as UserSession
from backend.app.models.enums import OpportunityType, LocationType
from backend.app.schemas.opportunity import OpportunityOut

router = APIRouter(prefix="/opportunities", tags=["Opportunities Discovery"])

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    token_hash = hash_token(token)
    now = datetime.now(timezone.utc)
    session_record = db.query(UserSession).filter(
        UserSession.session_token_hash == token_hash,
        UserSession.is_active == True,
        UserSession.expires_at > now
    ).first()
    if session_record:
        return db.query(User).filter(User.id == session_record.user_id).first()
    return None

@router.get("", response_model=List[OpportunityOut])
def list_opportunities(
    q: Optional[str] = Query(None, description="Search keyword in title, company, or description"),
    opportunity_type: Optional[OpportunityType] = None,
    location_type: Optional[LocationType] = None,
    location: Optional[str] = None,
    sort_by: str = Query("closing_date", description="'closing_date', 'newest', 'title'"),
    include_closed: bool = Query(False, description="Whether to include expired listings"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(Opportunity.is_active == True)

    now = datetime.now(timezone.utc)
    if not include_closed:
        query = query.filter(Opportunity.closing_date >= now)

    if q:
        kw = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Opportunity.title.ilike(kw),
                Opportunity.company_name.ilike(kw),
                Opportunity.description.ilike(kw),
                Opportunity.location.ilike(kw)
            )
        )

    if opportunity_type:
        query = query.filter(Opportunity.opportunity_type == opportunity_type)

    if location_type:
        query = query.filter(Opportunity.location_type == location_type)

    if location:
        query = query.filter(Opportunity.location.ilike(f"%{location.strip()}%"))

    # Sorting
    if sort_by == "newest":
        query = query.order_by(desc(Opportunity.created_at))
    elif sort_by == "title":
        query = query.order_by(asc(Opportunity.title))
    else:
        query = query.order_by(asc(Opportunity.closing_date))

    items = query.offset(offset).limit(limit).all()

    # Determine saved & applied states for authenticated student
    saved_ids = set()
    applied_ids = set()
    if current_user and current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile:
            saved_items = db.query(SavedOpportunity.opportunity_id).filter(SavedOpportunity.student_id == profile.id).all()
            saved_ids = {s[0] for s in saved_items}

            applied_items = db.query(Application.opportunity_id).filter(Application.student_id == profile.id).all()
            applied_ids = {a[0] for a in applied_items}

    results = []
    for opp in items:
        out = OpportunityOut.model_validate(opp)
        out.is_saved = opp.id in saved_ids
        out.has_applied = opp.id in applied_ids
        results.append(out)

    return results

@router.get("/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity_detail(
    opportunity_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity listing not found.")

    out = OpportunityOut.model_validate(opp)
    if current_user and current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile:
            is_saved = db.query(SavedOpportunity).filter(
                SavedOpportunity.student_id == profile.id,
                SavedOpportunity.opportunity_id == opp.id
            ).first() is not None
            out.is_saved = is_saved

            has_applied = db.query(Application).filter(
                Application.student_id == profile.id,
                Application.opportunity_id == opp.id
            ).first() is not None
            out.has_applied = has_applied

    return out
