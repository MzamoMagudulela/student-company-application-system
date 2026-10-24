import os
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import generate_reference_number
from backend.app.models.entities import (
    User,
    StudentProfile,
    CVDocument,
    CVAnalysis,
    Opportunity,
    SavedOpportunity,
    Application,
    ApplicationStatusHistory,
    Offer,
    Notification,
    UserMilestone,
    LearningResource,
    LearningProgress,
)
from backend.app.models.enums import (
    ApplicationStatus,
    OfferStatus,
    ALLOWED_STATUS_TRANSITIONS,
)
from backend.app.schemas.student import (
    StudentProfileUpdate,
    StudentProfileOut,
    CVDocumentOut,
    CVAnalysisOut,
    DashboardStatsOut,
)
from backend.app.schemas.application import (
    ApplicationSubmit,
    ApplicationOut,
    OfferOut,
)
from backend.app.schemas.opportunity import OpportunityOut
from backend.app.api.deps import (
    require_student,
    get_current_user,
    record_audit,
    create_user_notification,
)
from backend.app.services.cv_service import (
    validate_cv_file,
    extract_text_from_file,
    analyze_cv_content,
)
from backend.app.services.pdf_service import (
    generate_cv_pdf,
    generate_offer_letter_pdf,
)

router = APIRouter(prefix="/students", tags=["Student Features"])

def calculate_profile_completion(profile: StudentProfile) -> int:
    score = 20 # Base registration
    if profile.headline and len(profile.headline.strip()) >= 5:
        score += 15
    if profile.field_of_study and profile.institution:
        score += 20
    if profile.graduation_year:
        score += 10
    if profile.bio and len(profile.bio.strip()) >= 20:
        score += 15
    if profile.location:
        score += 10
    if profile.skills and len(profile.skills) >= 3:
        score += 10
    return min(score, 100)

@router.get("/profile", response_model=StudentProfileOut)
def get_student_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=current_user.id,
            first_name=current_user.username,
            last_name="Student",
            profile_completion_pct=25
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return StudentProfileOut.model_validate(profile)

@router.put("/profile", response_model=StudentProfileOut)
def update_student_profile(
    payload: StudentProfileUpdate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    profile.profile_completion_pct = calculate_profile_completion(profile)
    profile.updated_at = datetime.datetime.now(datetime.timezone.utc)

    # Check milestone: Profile Completed
    if profile.profile_completion_pct >= 90:
        existing_milestone = db.query(UserMilestone).filter(
            UserMilestone.user_id == current_user.id,
            UserMilestone.milestone_key == "profile_completed"
        ).first()
        if not existing_milestone:
            ms = UserMilestone(
                user_id=current_user.id,
                milestone_key="profile_completed",
                title="Profile Master",
                description="Completed over 90% of your student career profile."
            )
            db.add(ms)
            create_user_notification(
                db,
                user_id=current_user.id,
                title="Milestone Achieved: Profile Master",
                message="Your profile is complete and stands out to partner recruitment reviewers!",
                category="achievement",
                link="/student/profile"
            )

    db.commit()
    db.refresh(profile)

    record_audit(
        db,
        actor_id=current_user.id,
        action="UPDATE_STUDENT_PROFILE",
        target_entity="StudentProfile",
        target_id=str(profile.id),
        details=f"Profile completion: {profile.profile_completion_pct}%"
    )

    return StudentProfileOut.model_validate(profile)

@router.get("/dashboard-stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    profile_pct = profile.profile_completion_pct if profile else 20

    # Best CV readiness score
    latest_analysis = (
        db.query(CVAnalysis)
        .filter(CVAnalysis.student_id == profile.id if profile else 0)
        .order_by(CVAnalysis.analyzed_at.desc())
        .first()
    )
    cv_score = latest_analysis.score if latest_analysis else 0

    # Applications breakdown
    apps = db.query(Application).filter(Application.student_id == profile.id if profile else 0).all()
    submitted_count = len([a for a in apps if a.status != ApplicationStatus.DRAFT])
    under_review_count = len([a for a in apps if a.status in [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.ADDITIONAL_INFO_REQUESTED]])
    shortlisted_count = len([a for a in apps if a.status in [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW]])

    # Offers received
    offers_count = db.query(Offer).join(Application).filter(
        Application.student_id == (profile.id if profile else 0)
    ).count()

    # Saved count
    saved_count = db.query(SavedOpportunity).filter(
        SavedOpportunity.student_id == (profile.id if profile else 0)
    ).count()

    # Completed learning modules
    learning_completed = db.query(LearningProgress).filter(
        LearningProgress.student_id == (profile.id if profile else 0),
        LearningProgress.is_completed == True
    ).count()

    # Unread notifications
    unread_notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return DashboardStatsOut(
        profile_completion_pct=profile_pct,
        cv_readiness_score=cv_score,
        applications_submitted=submitted_count,
        applications_under_review=under_review_count,
        shortlisted_count=shortlisted_count,
        offers_received=offers_count,
        saved_opportunities_count=saved_count,
        learning_modules_completed=learning_completed,
        unread_notifications_count=unread_notifs
    )

@router.post("/cvs/upload", response_model=CVAnalysisOut)
async def upload_cv_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    file_bytes = await file.read()
    is_valid, err_msg, mime_type = validate_cv_file(file_bytes, file.filename or "cv.pdf")
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Secure storage naming
    file_ext = Path(file.filename).suffix.lower()
    stored_filename = f"cv_{profile.id}_{uuid.uuid4().hex[:12]}{file_ext}"
    storage_path = settings.CVS_DIR / stored_filename

    # Write file to private storage
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    # Extract text and analyze
    extracted_text = extract_text_from_file(storage_path, mime_type)
    analysis_result = analyze_cv_content(extracted_text)

    # Set existing primary CVs to false
    db.query(CVDocument).filter(CVDocument.student_id == profile.id).update({"is_primary": False})

    # Save CVDocument record
    cv_doc = CVDocument(
        student_id=profile.id,
        filename=file.filename,
        file_path=str(storage_path),
        file_size=len(file_bytes),
        mime_type=mime_type,
        is_primary=True,
        parsed_text=extracted_text[:10000],
        uploaded_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(cv_doc)
    db.flush()

    # Save CVAnalysis record
    cv_analysis = CVAnalysis(
        student_id=profile.id,
        cv_document_id=cv_doc.id,
        score=analysis_result["score"],
        checklist_results=analysis_result["checklist_results"],
        missing_sections=analysis_result["missing_sections"],
        strengths=analysis_result["strengths"],
        recommendations=analysis_result["recommendations"],
        analyzed_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(cv_analysis)

    # Award milestone: First CV Uploaded & Analyzed
    existing_ms = db.query(UserMilestone).filter(
        UserMilestone.user_id == current_user.id,
        UserMilestone.milestone_key == "cv_diagnostic_completed"
    ).first()
    if not existing_ms:
        ms = UserMilestone(
            user_id=current_user.id,
            milestone_key="cv_diagnostic_completed",
            title="CV Diagnostic Completed",
            description=f"Received a readiness diagnosis score of {analysis_result['score']}% from CV Doctor."
        )
        db.add(ms)

    create_user_notification(
        db,
        user_id=current_user.id,
        title="CV Doctor Analysis Complete",
        message=f"Your CV was analyzed. Diagnostic readiness score: {analysis_result['score']}/100. Review tailored recommendations.",
        category="cv_doctor",
        link="/student/cv-doctor"
    )

    db.commit()
    db.refresh(cv_analysis)

    record_audit(
        db,
        actor_id=current_user.id,
        action="CV_UPLOAD_AND_ANALYSIS",
        target_entity="CVDocument",
        target_id=str(cv_doc.id),
        details=f"Readiness score: {analysis_result['score']}"
    )

    return CVAnalysisOut.model_validate(cv_analysis)

@router.get("/cvs", response_model=List[CVDocumentOut])
def get_student_cvs(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []
    cvs = db.query(CVDocument).filter(CVDocument.student_id == profile.id).order_by(CVDocument.uploaded_at.desc()).all()
    return [CVDocumentOut.model_validate(cv) for cv in cvs]

@router.get("/cvs/{cv_id}/analysis", response_model=CVAnalysisOut)
def get_cv_analysis_by_id(
    cv_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    analysis = (
        db.query(CVAnalysis)
        .filter(CVAnalysis.student_id == profile.id, CVAnalysis.cv_document_id == cv_id)
        .order_by(CVAnalysis.analyzed_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No diagnostic analysis found for this CV.")
    return CVAnalysisOut.model_validate(analysis)

@router.get("/cvs/{cv_id}/download")
def download_student_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cv_doc = db.query(CVDocument).filter(CVDocument.id == cv_id).first()
    if not cv_doc:
        raise HTTPException(status_code=404, detail="CV document not found.")

    # Authorization: Student must own the CV, or actor must be admin
    profile = db.query(StudentProfile).filter(StudentProfile.id == cv_doc.student_id).first()
    if current_user.role != "admin" and (not profile or profile.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized access to document.")

    if not os.path.exists(cv_doc.file_path):
        raise HTTPException(status_code=404, detail="File could not be found on storage.")

    with open(cv_doc.file_path, "rb") as f:
        file_bytes = f.read()

    return Response(
        content=file_bytes,
        media_type=cv_doc.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{cv_doc.filename}"'
        }
    )

@router.post("/cv-builder/generate-pdf")
def generate_builder_cv_pdf(
    builder_data: dict,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    # Enrich builder data with user identity if missing
    if profile:
        builder_data.setdefault("first_name", profile.first_name)
        builder_data.setdefault("last_name", profile.last_name)
        builder_data.setdefault("headline", profile.headline)
        builder_data.setdefault("institution", profile.institution)
        builder_data.setdefault("field_of_study", profile.field_of_study)
        builder_data.setdefault("graduation_year", profile.graduation_year)
        builder_data.setdefault("location", profile.location)
    builder_data.setdefault("email", current_user.email)
    builder_data.setdefault("phone_number", current_user.phone_number)

    pdf_bytes = generate_cv_pdf(builder_data)

    record_audit(
        db,
        actor_id=current_user.id,
        action="CV_BUILDER_PDF_GENERATED",
        target_entity="User",
        target_id=str(current_user.id),
        details="Generated professional CV Builder PDF"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="MZAMO_Professional_CV.pdf"'
        }
    )

@router.get("/saved-opportunities", response_model=List[OpportunityOut])
def get_saved_opportunities(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    saved_items = db.query(SavedOpportunity).filter(SavedOpportunity.student_id == profile.id).all()
    opp_ids = [s.opportunity_id for s in saved_items]
    if not opp_ids:
        return []

    opportunities = db.query(Opportunity).filter(Opportunity.id.in_(opp_ids)).all()
    res = []
    for opp in opportunities:
        out = OpportunityOut.model_validate(opp)
        out.is_saved = True
        res.append(out)
    return res

@router.post("/saved-opportunities/{opportunity_id}/toggle")
def toggle_save_opportunity(
    opportunity_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    existing = db.query(SavedOpportunity).filter(
        SavedOpportunity.student_id == profile.id,
        SavedOpportunity.opportunity_id == opportunity_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False, "message": "Opportunity removed from saved list."}
    else:
        new_saved = SavedOpportunity(
            student_id=profile.id,
            opportunity_id=opportunity_id,
            saved_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(new_saved)

        # Milestone: First Opportunity Saved
        existing_ms = db.query(UserMilestone).filter(
            UserMilestone.user_id == current_user.id,
            UserMilestone.milestone_key == "first_opp_saved"
        ).first()
        if not existing_ms:
            ms = UserMilestone(
                user_id=current_user.id,
                milestone_key="first_opp_saved",
                title="Opportunity Scout",
                description="Bookmarked your first verified internship opportunity."
            )
            db.add(ms)

        db.commit()
        return {"saved": True, "message": "Opportunity saved to your bookmarks."}

@router.get("/applications", response_model=List[ApplicationOut])
def get_student_applications(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    apps = (
        db.query(Application)
        .filter(Application.student_id == profile.id)
        .order_by(Application.submitted_at.desc())
        .all()
    )
    return [ApplicationOut.model_validate(a) for a in apps]

@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_application_detail(
    application_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app_record.student_id != profile.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized access to this application.")

    return ApplicationOut.model_validate(app_record)

@router.post("/applications", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_application(
    payload: ApplicationSubmit,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    opp = db.query(Opportunity).filter(Opportunity.id == payload.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    # Check closing date
    now = datetime.datetime.now(datetime.timezone.utc)
    # Ensure timezone awareness comparison
    closing = opp.closing_date
    if closing.tzinfo is None:
        closing = closing.replace(tzinfo=datetime.timezone.utc)

    if closing < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Applications for this opportunity are officially closed."
        )

    # Check for duplicate submission
    existing = db.query(Application).filter(
        Application.student_id == profile.id,
        Application.opportunity_id == opp.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted an application for this opportunity (Ref: {existing.reference_number})."
        )

    # Resolve CV
    cv_id = payload.submitted_cv_id
    if not cv_id:
        primary_cv = db.query(CVDocument).filter(
            CVDocument.student_id == profile.id,
            CVDocument.is_primary == True
        ).first()
        if primary_cv:
            cv_id = primary_cv.id

    ref_number = generate_reference_number("APP")

    new_app = Application(
        reference_number=ref_number,
        student_id=profile.id,
        opportunity_id=opp.id,
        status=ApplicationStatus.SUBMITTED,
        submitted_cv_id=cv_id,
        cover_letter=payload.cover_letter,
        question_responses=payload.question_responses,
        submitted_at=now,
        updated_at=now
    )
    db.add(new_app)
    db.flush()

    # Create initial status history entry
    history = ApplicationStatusHistory(
        application_id=new_app.id,
        from_status=None,
        to_status=ApplicationStatus.SUBMITTED,
        changed_by_id=current_user.id,
        notes="Application submitted online by candidate with declaration acknowledgement.",
        timestamp=now
    )
    db.add(history)

    # Milestone: First Application Submitted
    existing_ms = db.query(UserMilestone).filter(
        UserMilestone.user_id == current_user.id,
        UserMilestone.milestone_key == "first_app_submitted"
    ).first()
    if not existing_ms:
        ms = UserMilestone(
            user_id=current_user.id,
            milestone_key="first_app_submitted",
            title="Application Pioneer",
            description=f"Submitted your first formal internship application ({ref_number})."
        )
        db.add(ms)

    create_user_notification(
        db,
        user_id=current_user.id,
        title="Application Successfully Submitted!",
        message=f"Your application for '{opp.title}' at {opp.company_name} was received. Reference: {ref_number}.",
        category="application",
        link=f"/student/applications"
    )

    db.commit()
    db.refresh(new_app)

    record_audit(
        db,
        actor_id=current_user.id,
        action="APPLICATION_SUBMITTED",
        target_entity="Application",
        target_id=str(new_app.id),
        details=f"Submitted application {ref_number} for opportunity #{opp.id}"
    )

    return ApplicationOut.model_validate(new_app)

@router.get("/offers", response_model=List[OfferOut])
def get_student_offers(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    offers = (
        db.query(Offer)
        .join(Application)
        .filter(Application.student_id == profile.id)
        .order_by(Offer.issue_date.desc())
        .all()
    )
    return [OfferOut.model_validate(o) for o in offers]

@router.post("/offers/{offer_id}/respond")
def respond_to_offer(
    offer_id: int,
    payload: dict,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    offer = db.query(Offer).join(Application).filter(
        Offer.id == offer_id,
        Application.student_id == profile.id
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer letter not found.")

    if offer.status != OfferStatus.ISSUED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This offer has already been marked as {offer.status}."
        )

    action = payload.get("action", "").lower().strip()
    notes = payload.get("notes", "")
    now = datetime.datetime.now(datetime.timezone.utc)

    if action == "accept":
        offer.status = OfferStatus.ACCEPTED
        offer.application.status = ApplicationStatus.ACCEPTED
        next_status = ApplicationStatus.ACCEPTED
    elif action == "decline":
        offer.status = OfferStatus.DECLINED
        offer.application.status = ApplicationStatus.OFFER_DECLINED
        next_status = ApplicationStatus.OFFER_DECLINED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'accept' or 'decline'.")

    offer.notes = notes
    offer.responded_at = now
    offer.application.updated_at = now

    # Record status transition history
    history = ApplicationStatusHistory(
        application_id=offer.application_id,
        from_status=ApplicationStatus.OFFERED,
        to_status=next_status,
        changed_by_id=current_user.id,
        notes=f"Student {action}ed offer. Note: {notes}",
        timestamp=now
    )
    db.add(history)

    # Notification & audit
    create_user_notification(
        db,
        user_id=current_user.id,
        title=f"Offer {action.capitalize()}ed",
        message=f"You have formally {action}ed the offer for '{offer.application.opportunity.title}'.",
        category="offer",
        link="/student/offers"
    )

    db.commit()

    record_audit(
        db,
        actor_id=current_user.id,
        action=f"OFFER_{action.upper()}",
        target_entity="Offer",
        target_id=str(offer.id),
        details=f"Student decision: {action}"
    )

    return {"success": True, "status": offer.status}

@router.get("/offers/{offer_id}/download-pdf")
def download_offer_pdf(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer letter record not found.")

    # Authorization
    profile = offer.application.student
    if current_user.role != "admin" and profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to offer document.")

    # Build PDF on the fly or load existing
    offer_data = {
        "offer_reference": offer.offer_reference,
        "issue_date": offer.issue_date.strftime("%d %B %Y"),
        "student_name": f"{profile.first_name} {profile.last_name}",
        "opportunity_title": offer.application.opportunity.title,
        "company_name": offer.application.opportunity.company_name,
        "response_deadline": offer.response_deadline.strftime("%d %B %Y"),
        "start_date": offer.start_date.strftime("%d %B %Y") if offer.start_date else "To be mutually agreed",
        "terms_and_conditions": offer.terms_and_conditions,
    }

    pdf_bytes = generate_offer_letter_pdf(offer_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Offer_Letter_{offer.offer_reference}.pdf"'
        }
    )

@router.get("/learning-progress")
def get_learning_progress(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    resources = db.query(LearningResource).filter(LearningResource.is_active == True).all()

    completed_ids = set()
    if profile:
        records = db.query(LearningProgress).filter(
            LearningProgress.student_id == profile.id,
            LearningProgress.is_completed == True
        ).all()
        completed_ids = {r.resource_id for r in records}

    result = []
    for r in resources:
        result.append({
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "description": r.description,
            "video_url": r.video_url,
            "duration_minutes": r.duration_minutes,
            "author": r.author,
            "is_completed": r.id in completed_ids
        })
    return result

@router.post("/learning-progress/{resource_id}/toggle")
def toggle_learning_completed(
    resource_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    res = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Learning module not found.")

    progress = db.query(LearningProgress).filter(
        LearningProgress.student_id == profile.id,
        LearningProgress.resource_id == resource_id
    ).first()

    now = datetime.datetime.now(datetime.timezone.utc)
    if progress:
        progress.is_completed = not progress.is_completed
        progress.completed_at = now if progress.is_completed else None
        db.commit()
        return {"completed": progress.is_completed}
    else:
        new_prog = LearningProgress(
            student_id=profile.id,
            resource_id=resource_id,
            is_completed=True,
            completed_at=now
        )
        db.add(new_prog)

        # Milestone: First learning module completed
        existing_ms = db.query(UserMilestone).filter(
            UserMilestone.user_id == current_user.id,
            UserMilestone.milestone_key == "first_learning_module"
        ).first()
        if not existing_ms:
            ms = UserMilestone(
                user_id=current_user.id,
                milestone_key="first_learning_module",
                title="Continuous Learner",
                description="Completed your first Career Learning Hub education module."
            )
            db.add(ms)

        db.commit()
        return {"completed": True}

@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notifs

@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
