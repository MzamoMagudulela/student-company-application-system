import os
import pytest
from pathlib import Path
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.core.security import hash_password
from backend.app.main import app
from backend.app.models.entities import User, StudentProfile, Opportunity, LearningResource
from backend.app.models.enums import UserRole, AccountStatus, OpportunityType, LocationType

TEST_DB_PATH = Path("./test_mydc.db").resolve()
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    # Seed Admin User
    admin = User(
        email="test_admin@mydc.co.za",
        username="test_admin",
        password_hash=hash_password("AdminPass2026!"),
        role=UserRole.ADMIN,
        account_status=AccountStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )
    db.add(admin)
    db.flush()

    # Seed Test Opportunity (Open)
    opp = Opportunity(
        title="Junior Python Test Developer",
        company_name="Acme Tech South Africa",
        opportunity_type=OpportunityType.INTERNSHIP,
        location="Johannesburg, Gauteng",
        location_type=LocationType.HYBRID,
        description="Test description for software development internship position.",
        requirements="BSc in Computer Science or National Diploma in ICT.",
        skills_required=["Python", "FastAPI", "SQL"],
        is_external=False,
        closing_date=now + timedelta(days=30),
        last_verified_at=now,
        is_active=True,
        created_by_id=admin.id,
        created_at=now,
        updated_at=now
    )
    db.add(opp)

    # Seed Closed Opportunity for test
    closed_opp = Opportunity(
        title="Expired Systems Intern",
        company_name="Closed Corp",
        opportunity_type=OpportunityType.INTERNSHIP,
        location="Cape Town",
        location_type=LocationType.ON_SITE,
        description="Expired position",
        requirements="IT diploma",
        skills_required=["Linux"],
        is_external=False,
        closing_date=now - timedelta(days=5),
        last_verified_at=now,
        is_active=True,
        created_by_id=admin.id,
        created_at=now - timedelta(days=20),
        updated_at=now - timedelta(days=20)
    )
    db.add(closed_opp)
    db.commit()
    db.close()

    yield

    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)
