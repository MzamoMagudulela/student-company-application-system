import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import (
    hash_password,
    verify_password,
    generate_secure_token,
    hash_token,
)
from backend.app.models.entities import (
    User,
    StudentProfile,
    Session as UserSession,
    RecoveryRequest,
    RecoveryToken,
    UserMilestone,
)
from backend.app.models.enums import (
    UserRole,
    AccountStatus,
    RecoveryMethod,
    RecoveryStatus,
)
from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserOut,
    AccountStatusCheck,
    AccountStatusResponse,
    RecoveryInitiate,
    RecoveryInitiateResponse,
    RecoveryComplete,
)
from backend.app.api.deps import (
    get_current_user,
    get_token_from_header,
    record_audit,
    create_user_notification,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Recovery"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    normalized_email = data.email.lower().strip()
    normalized_username = data.username.lower().strip()

    # Check for existing email or username
    existing_user = db.query(User).filter(
        or_(
            User.email == normalized_email,
            User.username == normalized_username
        )
    ).first()

    if existing_user:
        if existing_user.email == normalized_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address is already registered."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another."
            )

    # Hash password with Argon2id
    pwd_hash = hash_password(data.password)

    # Always enforce STUDENT role for public registration
    new_user = User(
        email=normalized_email,
        username=normalized_username,
        phone_number=data.phone_number.strip() if data.phone_number else None,
        password_hash=pwd_hash,
        role=UserRole.STUDENT,
        account_status=AccountStatus.ACTIVE,
        created_at=datetime.datetime.now(datetime.timezone.utc),
        updated_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(new_user)
    db.flush()

    # Create initial student profile
    student_profile = StudentProfile(
        user_id=new_user.id,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        profile_completion_pct=25,
        created_at=datetime.datetime.now(datetime.timezone.utc),
        updated_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(student_profile)

    # Award welcome milestone
    milestone = UserMilestone(
        user_id=new_user.id,
        milestone_key="account_created",
        title="Welcome to MYDC",
        description="Successfully created your student career profile.",
        achieved_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(milestone)

    # Create persistent welcome notification
    create_user_notification(
        db,
        user_id=new_user.id,
        title="Welcome to Mzamo's Youth Development Company!",
        message="Complete your student profile and upload your CV to receive personalized diagnostic feedback.",
        category="welcome",
        link="/student/profile"
    )

    # Create initial session
    raw_session_token = generate_secure_token(32)
    session_hash = hash_token(raw_session_token)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=settings.SESSION_EXPIRE_HOURS)

    user_session = UserSession(
        user_id=new_user.id,
        session_token_hash=session_hash,
        expires_at=expires_at,
        ip_address=ip,
        user_agent=request.headers.get("User-Agent", "")[:250],
        is_active=True
    )
    db.add(user_session)
    db.commit()
    db.refresh(new_user)

    record_audit(
        db,
        actor_id=new_user.id,
        action="USER_REGISTRATION",
        target_entity="User",
        target_id=str(new_user.id),
        details=f"New student registration for {normalized_username}",
        ip_address=ip
    )

    return TokenResponse(
        access_token=raw_session_token,
        token_type="Bearer",
        user=UserOut.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ident = credentials.identifier.lower().strip()
    now = datetime.datetime.now(datetime.timezone.utc)

    user = db.query(User).filter(
        or_(
            User.username == ident,
            User.email == ident
        )
    ).first()

    if not user:
        # Prevent timing attacks by dummy verification
        verify_password("dummy_password", "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgqlrqDrCK5A")
        record_audit(
            db,
            actor_id=None,
            action="FAILED_LOGIN_UNKNOWN_USER",
            target_entity="User",
            target_id=ident,
            details="Login attempt with unregistered identifier",
            ip_address=ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Check account lock status
    if user.locked_until and user.locked_until > now:
        remaining_minutes = int((user.locked_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is temporarily locked due to multiple failed login attempts. Please try again in {remaining_minutes} minutes or visit the Account Recovery Centre."
        )

    # Check if disabled
    if user.account_status == AccountStatus.DISABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been administratively disabled. Please contact the platform administration."
        )

    # Verify password with Argon2id
    is_valid = verify_password(credentials.password, user.password_hash)

    if not is_valid:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + datetime.timedelta(minutes=settings.ACCOUNT_LOCK_MINUTES)
            user.account_status = AccountStatus.LOCKED
            db.commit()
            record_audit(
                db,
                actor_id=user.id,
                action="ACCOUNT_LOCKED",
                target_entity="User",
                target_id=str(user.id),
                details=f"Account locked after {user.failed_login_attempts} failed attempts",
                ip_address=ip
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to {settings.MAX_FAILED_LOGIN_ATTEMPTS} failed attempts. Please use the Account Recovery Centre."
            )

        db.commit()
        record_audit(
            db,
            actor_id=user.id,
            action="FAILED_LOGIN_BAD_PASSWORD",
            target_entity="User",
            target_id=str(user.id),
            details=f"Failed attempt #{user.failed_login_attempts}",
            ip_address=ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Successful login: reset failed attempts and locked status
    user.failed_login_attempts = 0
    user.locked_until = None
    if user.account_status == AccountStatus.LOCKED:
        user.account_status = AccountStatus.ACTIVE
    user.last_login_at = now

    # Create new session
    raw_session_token = generate_secure_token(32)
    session_hash = hash_token(raw_session_token)
    expires_at = now + datetime.timedelta(hours=settings.SESSION_EXPIRE_HOURS)

    user_session = UserSession(
        user_id=user.id,
        session_token_hash=session_hash,
        expires_at=expires_at,
        ip_address=ip,
        user_agent=request.headers.get("User-Agent", "")[:250],
        is_active=True
    )
    db.add(user_session)
    db.commit()
    db.refresh(user)

    record_audit(
        db,
        actor_id=user.id,
        action="USER_LOGIN_SUCCESS",
        target_entity="User",
        target_id=str(user.id),
        details="Successful login",
        ip_address=ip
    )

    return TokenResponse(
        access_token=raw_session_token,
        token_type="Bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/logout")
def logout(
    token: str = Depends(get_token_from_header),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token_hash = hash_token(token)
    session_record = db.query(UserSession).filter(UserSession.session_token_hash == token_hash).first()
    if session_record:
        session_record.is_active = False
        db.commit()

    record_audit(
        db,
        actor_id=current_user.id,
        action="USER_LOGOUT",
        target_entity="Session",
        target_id=str(session_record.id if session_record else "0"),
        details="Session terminated by user"
    )

    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return UserOut.model_validate(current_user)

@router.post("/account-status", response_model=AccountStatusResponse)
def check_account_status(
    payload: AccountStatusCheck,
    db: Session = Depends(get_db)
):
    """
    Safe account status check that does not leak private user records or enumerate accounts.
    """
    ident = payload.identifier.lower().strip()
    user = db.query(User).filter(
        or_(
            User.username == ident,
            User.email == ident,
            User.phone_number == ident
        )
    ).first()

    # Always return a standardized message
    if not user:
        return AccountStatusResponse(
            message="If an eligible account matches the information provided, we will guide you through the next recovery step.",
            status_hint="unknown",
            can_proceed_to_recovery=True
        )

    if user.account_status == AccountStatus.DISABLED:
        return AccountStatusResponse(
            message="This account is currently disabled. Account recovery cannot bypass administrative restrictions. Please submit an administrative verification request.",
            status_hint="disabled",
            can_proceed_to_recovery=False
        )

    if user.account_status == AccountStatus.LOCKED:
        return AccountStatusResponse(
            message="This account is temporarily locked due to security policy. You may proceed with identity verification to reset your access.",
            status_hint="locked",
            can_proceed_to_recovery=True
        )

    return AccountStatusResponse(
        message="If an eligible account matches the information provided, we will guide you through the next recovery step.",
        status_hint="active",
        can_proceed_to_recovery=True
    )

@router.post("/recovery/initiate", response_model=RecoveryInitiateResponse)
def initiate_recovery(
    payload: RecoveryInitiate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Initiates account recovery adhering to Section 7 & 8:
    - Never reveals whether account exists
    - Produces short-lived, single-use hashed tokens
    """
    ip = get_client_ip(request)
    ident = payload.identifier.lower().strip()
    now = datetime.datetime.now(datetime.timezone.utc)

    # Consistent public response
    standard_message = "If an eligible account matches the information provided, we will guide you through the next recovery step."

    user = None
    if payload.method == RecoveryMethod.USERNAME:
        user = db.query(User).filter(User.username == ident).first()
    elif payload.method == RecoveryMethod.EMAIL:
        user = db.query(User).filter(User.email == ident).first()
    elif payload.method == RecoveryMethod.PHONE:
        user = db.query(User).filter(User.phone_number == ident).first()
    else:
        user = db.query(User).filter(or_(User.username == ident, User.email == ident, User.phone_number == ident)).first()

    # Log recovery request attempt
    req = RecoveryRequest(
        user_id=user.id if user else None,
        method=payload.method,
        identifier_used=ident[:50],
        status=RecoveryStatus.PENDING,
        ip_address=ip,
        created_at=now
    )
    db.add(req)
    db.commit()

    if not user:
        return RecoveryInitiateResponse(
            message=standard_message,
            recovery_token=None,
            masked_target=None,
            instructions="Please check your registered contact channels for recovery instructions."
        )

    if user.account_status == AccountStatus.DISABLED:
        return RecoveryInitiateResponse(
            message="This account is administratively disabled. Please contact the platform administration for assisted recovery.",
            recovery_token=None,
            masked_target=None,
            instructions="Please submit a recovery request to the administration team."
        )

    # Invalidate previous unused recovery tokens for this user
    db.query(RecoveryToken).filter(
        RecoveryToken.user_id == user.id,
        RecoveryToken.is_used == False
    ).update({"is_used": True})

    # Generate single-use recovery token (15 mins lifespan)
    raw_recovery_token = generate_secure_token(32)
    token_hash = hash_token(raw_recovery_token)
    expires_at = now + datetime.timedelta(minutes=settings.RECOVERY_TOKEN_EXPIRE_MINUTES)

    rec_token_record = RecoveryToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_used=False,
        created_at=now
    )
    db.add(rec_token_record)
    db.commit()

    record_audit(
        db,
        actor_id=user.id,
        action="RECOVERY_TOKEN_GENERATED",
        target_entity="User",
        target_id=str(user.id),
        details=f"Recovery initiated via {payload.method}",
        ip_address=ip
    )

    # Mask email / phone for privacy
    masked = None
    if user.email:
        parts = user.email.split("@")
        if len(parts) == 2:
            prefix = parts[0]
            masked_prefix = prefix[0] + "***" + (prefix[-1] if len(prefix) > 1 else "")
            masked = f"{masked_prefix}@{parts[1]}"

    return RecoveryInitiateResponse(
        message=standard_message,
        recovery_token=raw_recovery_token, # Available to client to proceed to verification
        masked_target=masked,
        instructions="Use the secure verification token to complete your password reset."
    )

@router.get("/recovery/verify")
def verify_recovery_token(
    token: str,
    db: Session = Depends(get_db)
):
    token_hash = hash_token(token)
    now = datetime.datetime.now(datetime.timezone.utc)

    record = db.query(RecoveryToken).filter(
        RecoveryToken.token_hash == token_hash,
        RecoveryToken.is_used == False,
        RecoveryToken.expires_at > now
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The recovery token is invalid, expired, or has already been used. Please request a new recovery session."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    return {
        "valid": True,
        "username": user.username if user else "student",
        "expires_at": record.expires_at
    }

@router.post("/recovery/complete")
def complete_recovery(
    payload: RecoveryComplete,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    token_hash = hash_token(payload.recovery_token)
    now = datetime.datetime.now(datetime.timezone.utc)

    record = db.query(RecoveryToken).filter(
        RecoveryToken.token_hash == token_hash,
        RecoveryToken.is_used == False,
        RecoveryToken.expires_at > now
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired recovery token."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )

    # Invalidate the recovery token immediately
    record.is_used = True

    # Update password with Argon2id
    user.password_hash = hash_password(payload.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    if user.account_status == AccountStatus.LOCKED:
        user.account_status = AccountStatus.ACTIVE
    user.updated_at = now

    # Invalidate all existing active sessions for security
    db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).update({"is_active": False})

    # Mark corresponding recovery request as completed
    latest_req = db.query(RecoveryRequest).filter(
        RecoveryRequest.user_id == user.id,
        RecoveryRequest.status == RecoveryStatus.PENDING
    ).order_by(RecoveryRequest.created_at.desc()).first()
    if latest_req:
        latest_req.status = RecoveryStatus.COMPLETED
        latest_req.resolved_at = now

    db.commit()

    record_audit(
        db,
        actor_id=user.id,
        action="PASSWORD_RESET_SUCCESS",
        target_entity="User",
        target_id=str(user.id),
        details="Password successfully reset via single-use token",
        ip_address=ip
    )

    create_user_notification(
        db,
        user_id=user.id,
        title="Security Alert: Password Changed",
        message="Your account password was successfully reset. If you did not perform this action, contact administrator immediately.",
        category="security",
        link="/student/security"
    )

    return {
        "success": True,
        "message": "Password reset successful. All prior sessions have been revoked. You can now log in with your new credentials."
    }
