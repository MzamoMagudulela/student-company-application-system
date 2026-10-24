import os
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import generate_reference_number, generate_secure_token, hash_token
from backend.app.models.entities import (
    User,
    StudentProfile,
    Opportunity,
    Application,
    ApplicationStatusHistory,
    ApplicationNote,
    Offer,
    AuditLog,
    RecoveryRequest,
    RecoveryToken,
    LearningResource,
    Notification,
)
from backend.app.models.enums import (
    UserRole,
    AccountStatus,
    ApplicationStatus,
    ALLOWED_STATUS_TRANSITIONS,
    OfferStatus,
    RecoveryStatus,
)
from backend.app.schemas.admin import (
    AdminStudentOut,
    AdminStudentStatusUpdate,
    AdminDashboardStats,
    AuditLogOut,
    IssueOfferRequest,
    RecoveryRequestOut,
    RecoveryRequestResolve,
)
from backend.app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityOut,
)
from backend.app.schemas.application import (
    ApplicationOut,
    ApplicationStatusUpdate,
    ApplicationNoteCreate,
    ApplicationNoteOut,
    OfferOut,
)
from backend.app.api.deps import (
    require_admin,
    record_audit,
    create_user_notification,
)
from backend.app.services.pdf_service import generate_offer_letter_pdf

router = APIRouter(prefix="/admin", tags=["Administration & Recruitment"])

@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    active_opps = db.query(Opportunity).filter(Opportunity.is_active == True).count()
    total_apps = db.query(Application).count()
    pending_reviews = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW])
    ).count()
    interviews = db.query(Application).filter(Application.status == ApplicationStatus.INTERVIEW).count()
    offers_issued = db.query(Offer).count()
    offers_accepted = db.query(Offer).filter(Offer.status == OfferStatus.ACCEPTED).count()

    recent_logs = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .limit(10)
        .all()
    )

    activity = []
    for log in recent_logs:
        actor_name = log.actor.username if log.actor else "System"
        activity.append({
            "id": log.id,
            "action": log.action,
            "actor": actor_name,
            "entity": log.target_entity,
            "details": log.details,
            "timestamp": log.created_at.isoformat()
        })

    return AdminDashboardStats(
        total_students=total_students,
        active_opportunities=active_opps,
        total_applications=total_apps,
        pending_reviews=pending_reviews,
        interviews_scheduled=interviews,
        offers_issued=offers_issued,
        offers_accepted=offers_accepted,
        recent_activity=activity
    )

@router.get("/students", response_model=List[AdminStudentOut])
def get_students_list(
    q: Optional[str] = Query(None),
    status: Optional[AccountStatus] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == UserRole.STUDENT)

    if q:
        kw = f"%{q.strip()}%"
        query = query.join(StudentProfile).filter(
            or_(
                User.username.ilike(kw),
                User.email.ilike(kw),
                StudentProfile.first_name.ilike(kw),
                StudentProfile.last_name.ilike(kw),
                StudentProfile.institution.ilike(kw)
            )
        )

    if status:
        query = query.filter(User.account_status == status)

    users = query.order_by(desc(User.created_at)).all()

    res = []
    for u in users:
        prof = u.profile
        app_count = db.query(Application).filter(Application.student_id == (prof.id if prof else 0)).count()
        res.append(AdminStudentOut(
            id=u.id,
            user_id=u.id,
            username=u.username,
            email=u.email,
            phone_number=u.phone_number,
            account_status=u.account_status,
            first_name=prof.first_name if prof else "N/A",
            last_name=prof.last_name if prof else "N/A",
            institution=prof.institution if prof else None,
            field_of_study=prof.field_of_study if prof else None,
            profile_completion_pct=prof.profile_completion_pct if prof else 20,
            applications_count=app_count,
            created_at=u.created_at,
            last_login_at=u.last_login_at
        ))
    return res

@router.put("/students/{student_user_id}/status")
def update_student_account_status(
    student_user_id: int,
    payload: AdminStudentStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == student_user_id, User.role == UserRole.STUDENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student account not found.")

    old_status = user.account_status
    user.account_status = payload.status
    if payload.status == AccountStatus.ACTIVE:
        user.failed_login_attempts = 0
        user.locked_until = None

    db.commit()

    record_audit(
        db,
        actor_id=current_admin.id,
        action="UPDATE_STUDENT_ACCOUNT_STATUS",
        target_entity="User",
        target_id=str(user.id),
        details=f"Status changed from {old_status} to {payload.status}. Reason: {payload.reason or 'Administrative update'}"
    )

    create_user_notification(
        db,
        user_id=user.id,
        title="Account Status Updated",
        message=f"Your account status is now '{payload.status}'. If you have questions, please reach out to administration.",
        category="security",
        link="/student/security"
    )

    return {"success": True, "new_status": user.account_status}

@router.get("/opportunities", response_model=List[OpportunityOut])
def admin_get_opportunities(
    q: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity)
    if q:
        kw = f"%{q.strip()}%"
        query = query.filter(or_(Opportunity.title.ilike(kw), Opportunity.company_name.ilike(kw)))
    opps = query.order_by(desc(Opportunity.created_at)).all()
    return [OpportunityOut.model_validate(o) for o in opps]

@router.post("/opportunities", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
def admin_create_opportunity(
    payload: OpportunityCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.now(datetime.timezone.utc)
    new_opp = Opportunity(
        title=payload.title.strip(),
        company_name=payload.company_name.strip(),
        opportunity_type=payload.opportunity_type,
        location=payload.location.strip(),
        location_type=payload.location_type,
        description=payload.description.strip(),
        requirements=payload.requirements.strip(),
        skills_required=payload.skills_required,
        official_url=payload.official_url.strip() if payload.official_url else None,
        is_external=payload.is_external,
        closing_date=payload.closing_date,
        last_verified_at=now,
        is_active=payload.is_active,
        created_by_id=current_admin.id,
        created_at=now,
        updated_at=now
    )
    db.add(new_opp)
    db.commit()
    db.refresh(new_opp)

    record_audit(
        db,
        actor_id=current_admin.id,
        action="CREATE_OPPORTUNITY",
        target_entity="Opportunity",
        target_id=str(new_opp.id),
        details=f"Created opportunity: {new_opp.title} at {new_opp.company_name}"
    )

    return OpportunityOut.model_validate(new_opp)

@router.put("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def admin_update_opportunity(
    opportunity_id: int,
    payload: OpportunityUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(opp, k, v)

    opp.last_verified_at = datetime.datetime.now(datetime.timezone.utc)
    opp.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(opp)

    record_audit(
        db,
        actor_id=current_admin.id,
        action="UPDATE_OPPORTUNITY",
        target_entity="Opportunity",
        target_id=str(opp.id),
        details=f"Updated opportunity: {opp.title}"
    )

    return OpportunityOut.model_validate(opp)

@router.delete("/opportunities/{opportunity_id}")
def admin_delete_opportunity(
    opportunity_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    title = opp.title
    db.delete(opp)
    db.commit()

    record_audit(
        db,
        actor_id=current_admin.id,
        action="DELETE_OPPORTUNITY",
        target_entity="Opportunity",
        target_id=str(opportunity_id),
        details=f"Deleted opportunity '{title}'"
    )

    return {"message": "Opportunity deleted successfully."}

@router.get("/applications", response_model=List[ApplicationOut])
def admin_get_applications(
    q: Optional[str] = Query(None),
    status: Optional[ApplicationStatus] = None,
    opportunity_id: Optional[int] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status)

    if opportunity_id:
        query = query.filter(Application.opportunity_id == opportunity_id)

    if q:
        kw = f"%{q.strip()}%"
        query = query.join(StudentProfile).join(Opportunity).filter(
            or_(
                Application.reference_number.ilike(kw),
                StudentProfile.first_name.ilike(kw),
                StudentProfile.last_name.ilike(kw),
                Opportunity.title.ilike(kw)
            )
        )

    apps = query.order_by(desc(Application.submitted_at)).all()
    return [ApplicationOut.model_validate(a) for a in apps]

@router.put("/applications/{application_id}/status", response_model=ApplicationOut)
def admin_update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    current_status = app_record.status
    target_status = payload.new_status

    # Validate explicit status transition
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if target_status not in allowed and target_status != current_status:
        allowed_names = ", ".join(s.value for s in allowed) if allowed else "None"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status transition from '{current_status.value}' to '{target_status.value}' is not permitted. Allowed next stages: {allowed_names}."
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    app_record.status = target_status
    app_record.updated_at = now

    # Record history
    history = ApplicationStatusHistory(
        application_id=app_record.id,
        from_status=current_status,
        to_status=target_status,
        changed_by_id=current_admin.id,
        notes=payload.notes or f"Status updated by {current_admin.username}",
        timestamp=now
    )
    db.add(history)

    # Notify student
    student_user_id = app_record.student.user_id
    create_user_notification(
        db,
        user_id=student_user_id,
        title=f"Application Update: {target_status.value}",
        message=f"Your application for '{app_record.opportunity.title}' has moved to '{target_status.value}'. Note: {payload.notes or 'Stage updated by recruitment team.'}",
        category="application_status",
        link=f"/student/applications"
    )

    db.commit()
    db.refresh(app_record)

    record_audit(
        db,
        actor_id=current_admin.id,
        action="UPDATE_APPLICATION_STATUS",
        target_entity="Application",
        target_id=str(app_record.id),
        details=f"Transitioned from {current_status} to {target_status}"
    )

    return ApplicationOut.model_validate(app_record)

@router.post("/applications/{application_id}/notes", response_model=ApplicationNoteOut)
def admin_add_application_note(
    application_id: int,
    payload: ApplicationNoteCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    note = ApplicationNote(
        application_id=app_record.id,
        author_id=current_admin.id,
        note_text=payload.note_text.strip(),
        is_internal=payload.is_internal,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    out = ApplicationNoteOut.model_validate(note)
    out.author_name = current_admin.username
    return out

@router.post("/applications/{application_id}/issue-offer", response_model=OfferOut)
def admin_issue_offer(
    application_id: int,
    payload: IssueOfferRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Check for existing offer
    existing_offer = db.query(Offer).filter(Offer.application_id == app_record.id).first()
    now = datetime.datetime.now(datetime.timezone.utc)

    if existing_offer:
        # Revoke or update
        existing_offer.status = OfferStatus.REVOKED
        db.flush()

    ref = generate_reference_number("OFFER")

    new_offer = Offer(
        offer_reference=ref,
        application_id=app_record.id,
        issued_by_id=current_admin.id,
        issue_date=now,
        response_deadline=payload.response_deadline,
        start_date=payload.start_date,
        terms_and_conditions=payload.terms_and_conditions,
        status=OfferStatus.ISSUED,
        notes=payload.notes,
    )
    db.add(new_offer)

    # Transition application status to OFFERED
    prev_status = app_record.status
    app_record.status = ApplicationStatus.OFFERED
    app_record.updated_at = now

    history = ApplicationStatusHistory(
        application_id=app_record.id,
        from_status=prev_status,
        to_status=ApplicationStatus.OFFERED,
        changed_by_id=current_admin.id,
        notes=f"Official Offer Letter issued ({ref}). Deadline: {payload.response_deadline.strftime('%Y-%m-%d')}",
        timestamp=now
    )
    db.add(history)

    # Notify student
    student_user_id = app_record.student.user_id
    create_user_notification(
        db,
        user_id=student_user_id,
        title="Congratulations! Formal Offer Received",
        message=f"You have received a formal offer of appointment for '{app_record.opportunity.title}' at {app_record.opportunity.company_name}. Please review and respond before {payload.response_deadline.strftime('%d %B %Y')}.",
        category="offer",
        link="/student/offers"
    )

    db.commit()
    db.refresh(new_offer)

    record_audit(
        db,
        actor_id=current_admin.id,
        action="ISSUE_OFFER_LETTER",
        target_entity="Offer",
        target_id=str(new_offer.id),
        details=f"Issued offer {ref} to candidate {app_record.student.first_name} {app_record.student.last_name}"
    )

    return OfferOut.model_validate(new_offer)

@router.get("/audit-logs", response_model=List[AuditLogOut])
def admin_get_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))

    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
    res = []
    for l in logs:
        out = AuditLogOut.model_validate(l)
        out.actor_username = l.actor.username if l.actor else "System"
        res.append(out)
    return res

@router.get("/recovery-requests", response_model=List[RecoveryRequestOut])
def admin_get_recovery_requests(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    reqs = db.query(RecoveryRequest).order_by(desc(RecoveryRequest.created_at)).limit(50).all()
    res = []
    for r in reqs:
        out = RecoveryRequestOut.model_validate(r)
        if r.user:
            out.username = r.user.username
            out.email = r.user.email
        res.append(out)
    return res

@router.post("/recovery-requests/{request_id}/resolve")
def admin_resolve_recovery_request(
    request_id: int,
    payload: RecoveryRequestResolve,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(RecoveryRequest).filter(RecoveryRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Recovery request not found.")

    now = datetime.datetime.now(datetime.timezone.utc)
    if payload.action == "approve_and_generate_token" and req.user:
        # Invalidate existing tokens
        db.query(RecoveryToken).filter(
            RecoveryToken.user_id == req.user_id,
            RecoveryToken.is_used == False
        ).update({"is_used": True})

        raw_token = generate_secure_token(32)
        token_hash = hash_token(raw_token)
        expires_at = now + datetime.timedelta(minutes=settings.RECOVERY_TOKEN_EXPIRE_MINUTES)

        rec_token = RecoveryToken(
            user_id=req.user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
            created_at=now
        )
        db.add(rec_token)
        req.status = RecoveryStatus.VERIFIED
        req.notes = f"Approved by admin {current_admin.username}. Note: {payload.notes}"
        req.resolved_at = now
        db.commit()

        record_audit(
            db,
            actor_id=current_admin.id,
            action="ADMIN_ASSISTED_RECOVERY_APPROVED",
            target_entity="RecoveryRequest",
            target_id=str(req.id),
            details=f"Generated recovery token for user #{req.user_id}"
        )

        return {
            "success": True,
            "status": req.status,
            "recovery_token": raw_token,
            "message": "Recovery request approved. Single-use token generated."
        }
    else:
        req.status = RecoveryStatus.EXPIRED
        req.notes = f"Rejected by admin {current_admin.username}. Reason: {payload.notes}"
        req.resolved_at = now
        db.commit()

        record_audit(
            db,
            actor_id=current_admin.id,
            action="ADMIN_ASSISTED_RECOVERY_REJECTED",
            target_entity="RecoveryRequest",
            target_id=str(req.id),
            details=f"Rejected recovery request #{req.id}"
        )

        return {"success": True, "status": req.status, "message": "Recovery request rejected."}

@router.get("/learning-resources")
def admin_get_learning_resources(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(LearningResource).order_by(desc(LearningResource.created_at)).all()

@router.post("/learning-resources")
def admin_create_learning_resource(
    payload: dict,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.now(datetime.timezone.utc)
    res = LearningResource(
        title=payload.get("title", "").strip(),
        category=payload.get("category", "CV Writing").strip(),
        description=payload.get("description", "").strip(),
        video_url=payload.get("video_url", "").strip(),
        duration_minutes=int(payload.get("duration_minutes", 15)),
        author=payload.get("author", "Mzamo Sandile Magudulela").strip(),
        is_active=True,
        created_at=now
    )
    db.add(res)
    db.commit()
    db.refresh(res)

    record_audit(
        db,
        actor_id=current_admin.id,
        action="CREATE_LEARNING_RESOURCE",
        target_entity="LearningResource",
        target_id=str(res.id),
        details=f"Added learning module: {res.title}"
    )

    return res

@router.delete("/learning-resources/{resource_id}")
def admin_delete_learning_resource(
    resource_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    res = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found.")
    db.delete(res)
    db.commit()
    return {"message": "Resource removed."}
