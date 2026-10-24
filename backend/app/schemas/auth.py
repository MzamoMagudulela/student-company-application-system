from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.models.enums import UserRole, AccountStatus, RecoveryMethod

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

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    phone_number: Optional[str] = None
    role: UserRole
    account_status: AccountStatus
    profile: Optional[StudentProfileOut] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=30)
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str = Field(..., min_length=8, max_length=128)
    terms_accepted: bool = Field(..., description="Privacy policy and terms acknowledgement")

    @field_validator('password_confirm')
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v

    @field_validator('terms_accepted')
    def terms_must_be_accepted(cls, v):
        if not v:
            raise ValueError('You must accept the terms of service and privacy policy to register.')
        return v

class UserLogin(BaseModel):
    identifier: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserOut

class AccountStatusCheck(BaseModel):
    identifier: str

class AccountStatusResponse(BaseModel):
    message: str
    status_hint: Optional[str] = None
    can_proceed_to_recovery: bool = True

class RecoveryInitiate(BaseModel):
    method: RecoveryMethod
    identifier: str = Field(..., description="Username, email, or phone number")

class RecoveryInitiateResponse(BaseModel):
    message: str
    recovery_token: Optional[str] = None  # Returned for local testing or SMS/email mock
    masked_target: Optional[str] = None
    instructions: str

class RecoveryComplete(BaseModel):
    recovery_token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('confirm_password')
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v
