import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import hash_token
from backend.app.models.entities import User, Session as UserSession, AuditLog, Notification
from backend.app.models.enums import UserRole, AccountStatus

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme. Expected Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return parts[1]

def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> User:
    token_hash = hash_token(token)
    now = datetime.datetime.now(datetime.timezone.utc)

    session_record = (
        db.query(UserSession)
        .filter(
            UserSession.session_token_hash == token_hash,
            UserSession.is_active == True,
            UserSession.expires_at > now
        )
        .first()
    )

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == session_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )

    # Check account status
    if user.account_status == AccountStatus.DISABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled by an administrator. Please contact support."
        )
    if user.account_status == AccountStatus.LOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to security policy. Please use the Account Recovery Centre."
        )

    return user

def require_student(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to registered students."
        )
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required."
        )
    return user

def record_audit(
    db: Session,
    actor_id: Optional[int],
    action: str,
    target_entity: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Helper to record secure audit log events."""
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        target_entity=target_entity,
        target_id=str(target_id) if target_id is not None else None,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()

def create_user_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    category: str = "general",
    link: Optional[str] = None
):
    """Helper to record persistent user notifications."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        link=link
    )
    db.add(notif)
    db.commit()
