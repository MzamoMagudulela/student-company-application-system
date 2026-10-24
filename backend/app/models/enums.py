import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    LOCKED = "locked"
    PENDING_VERIFICATION = "pending_verification"

class OpportunityType(str, enum.Enum):
    INTERNSHIP = "internship"
    GRADUATE_PROGRAMME = "graduate_programme"
    LEARNERSHIP = "learnership"
    ENTRY_LEVEL = "entry_level"

class LocationType(str, enum.Enum):
    ON_SITE = "on_site"
    REMOTE = "remote"
    HYBRID = "hybrid"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    SHORTLISTED = "Shortlisted"
    INTERVIEW = "Interview"
    ADDITIONAL_INFO_REQUESTED = "Additional Information Requested"
    OFFERED = "Offered"
    ACCEPTED = "Accepted"
    OFFER_DECLINED = "Offer Declined"
    OFFER_EXPIRED = "Offer Expired"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"

# Explicit allowed status transitions mapping
ALLOWED_STATUS_TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.DRAFT: {
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.SUBMITTED: {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.UNDER_REVIEW: {
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.ADDITIONAL_INFO_REQUESTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.ADDITIONAL_INFO_REQUESTED: {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.SHORTLISTED: {
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.OFFERED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.INTERVIEW: {
        ApplicationStatus.OFFERED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
    },
    ApplicationStatus.OFFERED: {
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.OFFER_DECLINED,
        ApplicationStatus.OFFER_EXPIRED
    },
    ApplicationStatus.ACCEPTED: set(),
    ApplicationStatus.OFFER_DECLINED: set(),
    ApplicationStatus.OFFER_EXPIRED: set(),
    ApplicationStatus.REJECTED: set(),
    ApplicationStatus.WITHDRAWN: set()
}

class OfferStatus(str, enum.Enum):
    ISSUED = "issued"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"

class RecoveryMethod(str, enum.Enum):
    USERNAME = "username"
    PHONE = "phone"
    EMAIL = "email"
    QR_CODE = "qr_code"
    ADMIN_ASSISTED = "admin_assisted"

class RecoveryStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
