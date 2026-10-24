# Mzamo's Youth Development Company
## Student Company Application System — Enterprise Edition

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-red.svg?style=flat)](https://alembic.sqlalchemy.org)
[![ReportLab](https://img.shields.io/badge/ReportLab-PDF_Engine-blue.svg?style=flat)](https://www.reportlab.com)
[![Argon2id](https://img.shields.io/badge/Argon2id-Password_Hashing-black.svg?style=flat)](https://www.argon2.org)

> **Creator & Developer:** Mzamo Sandile Magudulela (ICT Student & Software Engineer)  
> **Brand:** Mzamo's Youth Development Company  
> **Tagline:** *Your Skills. Your Opportunity. Your Future.*  
> **Application:** Student Company Application System — Enterprise Edition

---

## 1. System Overview

The **Student Company Application System** is a full-stack, enterprise-grade recruitment and career-readiness platform designed to help students and recent graduates discover verified internships, diagnose and enhance their CVs using an objective 6-factor evaluation engine, submit applications through a structured multi-step process, and manage formal offers.

### Core Value Pillars
- **Zero Mock Data:** Built on a production-ready SQLite database (`mydc_app.db`) managed through SQLAlchemy 2.0 and Alembic schema migrations.
- **Enterprise Visual Identity:** High-contrast palette featuring Primary Navy (`#142B4A`), Teal (`#0F9D8A`), Page Canvas (`#F4F7FB`), and dark mode equivalents (`#101827`, `#162235`, `#36C9B1`) with subtle animated background bubbles and glassmorphism cards.
- **Fair CV Doctor:** An automated diagnostic tool that scores student CVs (0–100%) against academic projects, technical keywords, and coursework without penalizing graduates for lacking corporate tenure.
- **QR-Code Account Recovery Centre:** Scannable, origin-verified recovery workflow with 15-minute single-use hashed tokens, account lockout enforcement, and administrator-assisted identity recovery.
- **Enterprise PDF Generation:** Server-side PDF generation for CVs and official Offer Letters powered by ReportLab.

---

## 2. Technology Architecture

### Frontend
- **React 19 with Vite** (Fast HMR and production bundling).
- **Tailwind CSS** with design token variables for Light, Dark, and System modes.
- **Lucide React** enterprise icons.
- **TanStack Query (v5)** for API state, loading skeletons, and automatic cache invalidation.
- **React Hook Form & Zod** for schema validation.
- **Recharts** for recruitment pipeline analytics.
- **qrcode.react** & **html5-qrcode** for recovery QR generation and camera-based origin-verified scanning.
- **Accessible Command Palette (`Ctrl+K` / `Cmd+K`)** with role-based filtering.

### Backend
- **Python 3.14** with **FastAPI**.
- **SQLAlchemy 2.0** ORM & **Alembic** migrations.
- **SQLite 3** with foreign key constraints (`PRAGMA foreign_keys = ON`).
- **Argon2id** password hashing (`argon2-cffi`).
- **Cryptographic session tokens** (256-bit URL-safe, stored as SHA-256 hashes).
- **ReportLab** for PDF offer letters and CV exports.
- **pypdf** & **python-docx** for CV parsing and analysis.
- **pytest** test suite with an isolated SQLite test database.

---

## 3. Quick Start & Installation

### Prerequisites
- Python 3.11+ (Python 3.14 compatible)
- Node.js 18+ and npm 9+

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows PowerShell
# source venv/bin/activate     # On Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations to initialize SQLite database
alembic upgrade head

# Start FastAPI development server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be available at: `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
The frontend interface will open at: `http://localhost:5173`

---

## 4. Default Seeded Credentials

On initial launch, the system automatically seeds the following verified accounts and listings:

| Role | Username / Identifier | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin` (or `admin@mydc.org.za`) | `MzamoAdmin2026!` | Full recruitment management, students, offers, audit logs, recovery |
| **New Student** | Self-register via `/register` | User defined | Student dashboard, CV Doctor, applications, offers |

---

## 5. Account Recovery Centre & QR Code Protocol

The **Account Recovery Centre** (`/recovery`) provides a 6-step guided recovery workflow:
1. **Method Selection:** Choose Username, Phone, Email, Scan QR, or Administrator Assisted.
2. **Identifier Entry:** Non-enumerating lookup returning consistent messaging:  
   *“If an eligible account matches the information provided, we will guide you through the next recovery step.”*
3. **Single-Use Token Verification:** Issues a 15-minute, single-use token hashed with SHA-256.
4. **Account Status Check:** Validates account standing (`Active`, `Disabled`, `Locked`).
5. **Secure Password Reset:** Updates password using Argon2id and immediately revokes all prior active sessions.
6. **Token Reuse Prevention:** The single-use token is immediately invalidated upon first use.

### Mobile QR Code
The QR code is rendered from the configured application domain (`window.location.origin/recovery`). When scanned with the in-browser camera scanner, the application verifies the origin matches the trusted server before navigating.

---

## 6. Automated Test Suite

A complete test suite is provided in `backend/tests/` using an isolated SQLite database:

```bash
# Set PYTHONPATH to project root and run pytest
$env:PYTHONPATH="."
.\backend\venv\Scripts\pytest.exe backend/tests -v
```

### Verified Test Cases:
- `test_student_registration_and_login`: Student registration, Argon2id verification, session logout.
- `test_login_failed_attempts_and_lockout`: Account lockout after 5 consecutive failed login attempts.
- `test_account_recovery_and_token_reuse_prevention`: Non-enumerating initiation, single-use token verification, password reset, and **rejection of token reuse**.
- `test_opportunity_discovery_and_filtering`: Keyword search and opportunity type filtering.
- `test_application_workflow_and_duplicate_prevention`: Multi-step submission and **prevention of duplicate applications**.
- `test_closed_opportunity_submission_rejection`: Automatic rejection of applications to expired opportunities.
- `test_admin_application_review_and_offer_issuance`: State transition machine validation, offer issuance, ReportLab PDF generation, student acceptance, and audit log persistence.

---

## 7. Database Maintenance & Disaster Recovery

The SQLite database file is located at `backend/mydc_app.db`.

### Hot Backup Procedure:
```powershell
sqlite3 backend/mydc_app.db ".backup 'storage/backups/mydc_backup_$(Get-Date -Format yyyyMMdd_HHmm).db'"
```

### Restoration Procedure:
```powershell
Copy-Item "storage/backups/mydc_backup_20261024_0000.db" -Destination "backend/mydc_app.db" -Force
```

---

## 8. Acknowledgements & Attribution

Designed and developed by **Mzamo Sandile Magudulela**, an ICT student, for **Mzamo's Youth Development Company**.  
*Your Skills. Your Opportunity. Your Future.*
