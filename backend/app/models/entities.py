import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.enums import (
    UserRole, AccountStatus, OpportunityType, LocationType,
    ApplicationStatus, OfferStatus, RecoveryMethod, RecoveryStatus
)

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    phone_number = Column(String(50), nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    account_status = Column(SQLEnum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="[AuditLog.actor_id]")
    recovery_requests = relationship("RecoveryRequest", back_populates="user", cascade="all, delete-orphan")
    recovery_tokens = relationship("RecoveryToken", back_populates="user", cascade="all, delete-orphan")
    milestones = relationship("UserMilestone", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token_hash = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="sessions")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    headline = Column(String(200), nullable=True)
    field_of_study = Column(String(150), nullable=True)
    institution = Column(String(200), nullable=True)
    graduation_year = Column(String(10), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(150), nullable=True)
    skills = Column(JSON, default=list, nullable=False)
    profile_completion_pct = Column(Integer, default=20, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="profile")
    cv_documents = relationship("CVDocument", back_populates="student", cascade="all, delete-orphan")
    cv_analyses = relationship("CVAnalysis", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    saved_opportunities = relationship("SavedOpportunity", back_populates="student", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="student", cascade="all, delete-orphan")

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    opportunity_type = Column(SQLEnum(OpportunityType), default=OpportunityType.INTERNSHIP, nullable=False, index=True)
    location = Column(String(150), nullable=False)
    location_type = Column(SQLEnum(LocationType), default=LocationType.ON_SITE, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    skills_required = Column(JSON, default=list, nullable=False)
    official_url = Column(String(500), nullable=True)
    is_external = Column(Boolean, default=False, nullable=False)
    closing_date = Column(DateTime, nullable=False, index=True)
    last_verified_at = Column(DateTime, default=utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    creator = relationship("User", foreign_keys=[created_by_id])
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")
    saved_by = relationship("SavedOpportunity", back_populates="opportunity", cascade="all, delete-orphan")

class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_at = Column(DateTime, default=utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="saved_opportunities")
    opportunity = relationship("Opportunity", back_populates="saved_by")

    __table_args__ = (
        Index("ix_student_opportunity_unique_saved", "student_id", "opportunity_id", unique=True),
    )

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False, index=True)
    submitted_cv_id = Column(Integer, ForeignKey("cv_documents.id", ondelete="SET NULL"), nullable=True)
    cover_letter = Column(Text, nullable=True)
    question_responses = Column(JSON, default=dict, nullable=False)
    submitted_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="applications")
    opportunity = relationship("Opportunity", back_populates="applications")
    submitted_cv = relationship("CVDocument")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.timestamp.asc()")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    notes = relationship("ApplicationNote", back_populates="application", cascade="all, delete-orphan")
    offer = relationship("Offer", back_populates="application", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_student_opportunity_unique_app", "student_id", "opportunity_id", unique=True),
    )

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(SQLEnum(ApplicationStatus), nullable=True)
    to_status = Column(SQLEnum(ApplicationStatus), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utcnow, nullable=False)

    application = relationship("Application", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_id])

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=utcnow, nullable=False)

    application = relationship("Application", back_populates="documents")

class ApplicationNote(Base):
    __tablename__ = "application_notes"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    application = relationship("Application", back_populates="notes")
    author = relationship("User", foreign_keys=[author_id])

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    offer_reference = Column(String(50), unique=True, nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    issued_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    issue_date = Column(DateTime, default=utcnow, nullable=False)
    response_deadline = Column(DateTime, nullable=False)
    start_date = Column(DateTime, nullable=True)
    terms_and_conditions = Column(Text, nullable=False)
    status = Column(SQLEnum(OfferStatus), default=OfferStatus.ISSUED, nullable=False, index=True)
    document_path = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="offer")
    issued_by = relationship("User", foreign_keys=[issued_by_id])

class CVDocument(Base):
    __tablename__ = "cv_documents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    parsed_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="cv_documents")
    analyses = relationship("CVAnalysis", back_populates="cv_document", cascade="all, delete-orphan")

class CVAnalysis(Base):
    __tablename__ = "cv_analyses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    cv_document_id = Column(Integer, ForeignKey("cv_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    checklist_results = Column(JSON, default=dict, nullable=False)
    missing_sections = Column(JSON, default=list, nullable=False)
    strengths = Column(JSON, default=list, nullable=False)
    recommendations = Column(JSON, default=list, nullable=False)
    analyzed_at = Column(DateTime, default=utcnow, nullable=False)

    student = relationship("StudentProfile", back_populates="cv_analyses")
    cv_document = relationship("CVDocument", back_populates="analyses")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="general", nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

class UserMilestone(Base):
    __tablename__ = "user_milestones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_key = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    achieved_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="milestones")

    __table_args__ = (
        Index("ix_user_milestone_unique", "user_id", "milestone_key", unique=True),
    )

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    video_url = Column(String(500), nullable=False)
    duration_minutes = Column(Integer, default=15, nullable=False)
    author = Column(String(150), default="Mzamo Sandile Magudulela", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    progress = relationship("LearningProgress", back_populates="resource", cascade="all, delete-orphan")

class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("learning_resources.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", back_populates="learning_progress")
    resource = relationship("LearningResource", back_populates="progress")

    __table_args__ = (
        Index("ix_student_learning_unique", "student_id", "resource_id", unique=True),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    actor = relationship("User", foreign_keys=[actor_id], back_populates="audit_logs")

class RecoveryRequest(Base):
    __tablename__ = "recovery_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    method = Column(SQLEnum(RecoveryMethod), nullable=False)
    identifier_used = Column(String(255), nullable=True)
    status = Column(SQLEnum(RecoveryStatus), default=RecoveryStatus.PENDING, nullable=False, index=True)
    ip_address = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="recovery_requests")

class RecoveryToken(Base):
    __tablename__ = "recovery_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="recovery_tokens")
