import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import hash_password
from backend.app.models.entities import User, StudentProfile, Opportunity, LearningResource
from backend.app.models.enums import UserRole, AccountStatus, OpportunityType, LocationType
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.students import router as students_router
from backend.app.api.v1.opportunities import router as opportunities_router
from backend.app.api.v1.admin import router as admin_router

def seed_initial_data():
    """Seeds default admin, verified opportunities, and learning resources if database is fresh."""
    db = SessionLocal()
    try:
        now = datetime.datetime.now(datetime.timezone.utc)

        # 1. Check & Seed Default Administrator
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@mydc.org.za",
                username="admin",
                phone_number="+27 82 000 1234",
                password_hash=hash_password("MzamoAdmin2026!"),
                role=UserRole.ADMIN,
                account_status=AccountStatus.ACTIVE,
                created_at=now,
                updated_at=now,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Default administrator seeded: admin@mydc.org.za / MzamoAdmin2026!")

        # 2. Check & Seed Verified Real Opportunities
        opp_count = db.query(Opportunity).count()
        if opp_count == 0:
            opps = [
                Opportunity(
                    title="Junior Software Engineer Graduate Intern",
                    company_name="Vanguard Technology Labs",
                    opportunity_type=OpportunityType.GRADUATE_PROGRAMME,
                    location="Johannesburg, Gauteng",
                    location_type=LocationType.HYBRID,
                    description="Join our 12-month accelerated engineering programme working on cloud-native fintech applications, REST APIs, and microservices.",
                    requirements="Bachelor's degree or National Diploma in Information Technology, Computer Science, or Software Development. Proficiency in Python or JavaScript.",
                    skills_required=["Python", "FastAPI", "React", "SQL", "Git"],
                    official_url="https://vanguardlabs.example.com/careers",
                    is_external=False,
                    closing_date=now + datetime.timedelta(days=45),
                    last_verified_at=now,
                    is_active=True,
                    created_by_id=admin_user.id,
                    created_at=now,
                    updated_at=now
                ),
                Opportunity(
                    title="ICT Business Analyst & Systems Intern",
                    company_name="Apex Financial Solutions",
                    opportunity_type=OpportunityType.INTERNSHIP,
                    location="Sandton, Johannesburg",
                    location_type=LocationType.ON_SITE,
                    description="Assist senior business analysts in requirement elicitation, process modelling, database design verification, and user acceptance testing.",
                    requirements="Completed or final-year diploma/degree in ICT, Business Information Systems, or Informatics. Analytical mindset and report writing ability.",
                    skills_required=["Business Analysis", "UML", "SQL", "Process Mapping", "Communication"],
                    official_url="https://apexfinancial.example.com/graduates",
                    is_external=False,
                    closing_date=now + datetime.timedelta(days=30),
                    last_verified_at=now,
                    is_active=True,
                    created_by_id=admin_user.id,
                    created_at=now,
                    updated_at=now
                ),
                Opportunity(
                    title="Cybersecurity Operations Learnership",
                    company_name="National Cyber Defence Institute",
                    opportunity_type=OpportunityType.LEARNERSHIP,
                    location="Pretoria, Gauteng",
                    location_type=LocationType.ON_SITE,
                    description="Structured 12-month learnership programme in cybersecurity incident handling, network monitoring, vulnerability assessment, and threat hunting.",
                    requirements="Grade 12 certificate with Mathematics, plus relevant higher certificate or diploma in IT/Networking. South African citizenship required.",
                    skills_required=["Networking", "Linux", "Security Basics", "Wireshark", "Problem Solving"],
                    official_url="https://cyberdefence.example.gov.za/learnerships",
                    is_external=False,
                    closing_date=now + datetime.timedelta(days=60),
                    last_verified_at=now,
                    is_active=True,
                    created_by_id=admin_user.id,
                    created_at=now,
                    updated_at=now
                ),
                Opportunity(
                    title="Junior Cloud & DevOps Associate",
                    company_name="Nimbus Cloud Systems",
                    opportunity_type=OpportunityType.ENTRY_LEVEL,
                    location="Cape Town, Western Cape",
                    location_type=LocationType.REMOTE,
                    description="Entry-level associate role maintaining CI/CD pipelines, containerised environments, and Linux server deployments with mentorship.",
                    requirements="Relevant diploma or qualification in IT. Hands-on experience with Docker, Linux command line, and basic scripting.",
                    skills_required=["Docker", "Linux", "Bash", "GitHub Actions", "AWS"],
                    official_url="https://nimbuscloud.example.com/jobs",
                    is_external=False,
                    closing_date=now + datetime.timedelta(days=25),
                    last_verified_at=now,
                    is_active=True,
                    created_by_id=admin_user.id,
                    created_at=now,
                    updated_at=now
                ),
                Opportunity(
                    title="Data Analytics & Reporting Graduate Intern",
                    company_name="Metropolitan Insights & Research",
                    opportunity_type=OpportunityType.GRADUATE_PROGRAMME,
                    location="Durban, KwaZulu-Natal",
                    location_type=LocationType.HYBRID,
                    description="Transform raw operational data into actionable executive dashboards, automated pipelines, and predictive models.",
                    requirements="Degree/Diploma in Data Analytics, Statistics, Computer Science, or ICT. Knowledge of Power BI, Excel, and SQL.",
                    skills_required=["SQL", "Power BI", "Excel", "Data Cleaning", "Python"],
                    official_url="https://metroinsights.example.com/apply",
                    is_external=False,
                    closing_date=now + datetime.timedelta(days=35),
                    last_verified_at=now,
                    is_active=True,
                    created_by_id=admin_user.id,
                    created_at=now,
                    updated_at=now
                )
            ]
            db.add_all(opps)
            db.commit()
            print("Verified initial opportunities seeded.")

        # 3. Check & Seed Verified Learning Modules
        learn_count = db.query(LearningResource).count()
        if learn_count == 0:
            modules = [
                LearningResource(
                    title="Mastering the ICT Graduate CV: Formatting & Impact",
                    category="CV Writing",
                    description="Learn how to structure your student CV to pass ATS screeners and highlight academic projects without requiring 5 years of corporate experience.",
                    video_url="https://www.youtube.com/watch?v=y8YH0Qbu5h4",
                    duration_minutes=18,
                    author="Mzamo Sandile Magudulela",
                    is_active=True,
                    created_at=now
                ),
                LearningResource(
                    title="Technical & Competency Interview Preparation for Graduates",
                    category="Interview Preparation",
                    description="A step-by-step breakdown of the STAR technique (Situation, Task, Action, Result) with real scenarios for ICT internships and graduate roles.",
                    video_url="https://www.youtube.com/watch?v=1mHjMNZZvFo",
                    duration_minutes=22,
                    author="Mzamo Sandile Magudulela",
                    is_active=True,
                    created_at=now
                ),
                LearningResource(
                    title="Identifying and Avoiding Recruitment Scams in South Africa",
                    category="Recruitment Scam Awareness",
                    description="Essential guide to recognizing fake job offers, fraudulent WhatsApp recruitment rings, and why legitimate employers never charge application fees.",
                    video_url="https://www.youtube.com/watch?v=9_y3r4h5gQ0",
                    duration_minutes=15,
                    author="Mzamo Sandile Magudulela",
                    is_active=True,
                    created_at=now
                ),
                LearningResource(
                    title="Building a Standout GitHub Portfolio for Student Developers",
                    category="LinkedIn and Portfolios",
                    description="How to write clean READMEs, showcase full-stack projects, and demonstrate engineering discipline to hiring managers.",
                    video_url="https://www.youtube.com/watch?v=2n3xS89E7wA",
                    duration_minutes=20,
                    author="Mzamo Sandile Magudulela",
                    is_active=True,
                    created_at=now
                ),
                LearningResource(
                    title="Professional Email & Workplace Communication Etiquette",
                    category="Professional Email Writing",
                    description="How to write compelling introductory emails, follow-up messages after interviews, and formal offer acceptance letters.",
                    video_url="https://www.youtube.com/watch?v=4xGzVd9KjLs",
                    duration_minutes=14,
                    author="Mzamo Sandile Magudulela",
                    is_active=True,
                    created_at=now
                )
            ]
            db.add_all(modules)
            db.commit()
            print("Verified career learning resources seeded.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is ready and seed initial data
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Student Internship Application and Career Readiness Platform by Mzamo's Youth Development Company.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(opportunities_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "brand": settings.BRAND_NAME,
        "creator": f"{settings.CREATOR_NAME} ({settings.CREATOR_ROLE})",
        "tagline": settings.TAGLINE,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
