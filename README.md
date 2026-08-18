# VVITU Placement Portal

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-Deployed-F38020?logo=cloudflare&logoColor=white)](https://vvitu-placement-portal.pages.dev/)

A centralized, enterprise-grade **Campus Placement & Recruitment Portal** engineered for Vasireddy Venkatadri Institute of Technology (VVIT). The platform seamlessly connects students, alumni recruiters, placement officers, and super administrators to manage job postings, student eligibility matching, resume parsing, OCR document verification, screening questionnaires, and application tracking.

---

## Table of Contents

- [VVITU Placement Portal](#vvitu-placement-portal)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. Problem Statement](#2-problem-statement)
  - [3. Key Features](#3-key-features)
    - [Authentication \& Security](#authentication--security)
    - [Student Capabilities](#student-capabilities)
    - [Alumni / Recruiter Capabilities](#alumni--recruiter-capabilities)
    - [Administrator Capabilities](#administrator-capabilities)
    - [Super Admin Capabilities](#super-admin-capabilities)
  - [4. Application Workflow](#4-application-workflow)
  - [5. System Architecture](#5-system-architecture)
  - [6. Technology Stack](#6-technology-stack)
  - [7. Repository Directory Structure](#7-repository-directory-structure)
  - [8. Frontend Architecture](#8-frontend-architecture)
  - [9. Backend Architecture](#9-backend-architecture)
  - [10. Authentication \& Authorization](#10-authentication--authorization)
  - [11. Core System Modules](#11-core-system-modules)
    - [Student Module](#student-module)
    - [Alumni Module \& OCR Engine](#alumni-module--ocr-engine)
    - [Admin \& Moderation Module](#admin--moderation-module)
    - [Job Lifecycle \& Application Workflows](#job-lifecycle--application-workflows)
  - [12. Resume \& Document Handling](#12-resume--document-handling)
  - [13. Database Schema \& Entity Relationships](#13-database-schema--entity-relationships)
  - [14. REST API Documentation](#14-rest-api-documentation)
    - [Authentication Endpoints (`/api/auth`)](#authentication-endpoints-apiauth)
    - [Student Endpoints (`/api/student`)](#student-endpoints-apistudent)
    - [Alumni Endpoints (`/api/alumni`)](#alumni-endpoints-apialumni)
    - [Job Endpoints (`/api/jobs`)](#job-endpoints-apijobs)
    - [Admin Endpoints (`/api/admin`)](#admin-endpoints-apiadmin)
    - [Super Admin Endpoints (`/api/super-admin`)](#super-admin-endpoints-apisuper-admin)
  - [15. Environment Setup \& Configuration](#15-environment-setup--configuration)
  - [16. Local Installation \& Setup Guide](#16-local-installation--setup-guide)
  - [17. Automated \& Manual Testing](#17-automated--manual-testing)
  - [18. Security Architecture](#18-security-architecture)
  - [19. Error Handling \& Reliability](#19-error-handling--reliability)
  - [20. Deployment Architecture](#20-deployment-architecture)
  - [21. Known Limitations \& Future Roadmap](#21-known-limitations--future-roadmap)
  - [22. Contributing](#22-contributing)
  - [23. License](#23-license)

---

## 1. Project Overview

The **VVITU Placement Portal** modernizes and automates institutional placement operations. Traditionally, placement officers rely on manual spreadsheets, unverified communication channels, and fragmented Google Forms. This portal unifies the placement lifecycle into a role-governed web application.

- **Target Users**:
  - **Students**: Search matching placement opportunities, verify eligibility (CGPA, backlogs, department), upload resumes, fill screening questionnaires, and track application statuses.
  - **Alumni / Recruiters**: Post job openings, upload company details, undergo degree verification (OCR backed), screen applicants, and manage candidate pipelines.
  - **Placement Officers (Admins)**: Approve or reject job postings, verify alumni registrations, manage student records, view placement statistics, export candidate lists to Excel/CSV/PDF, and delete obsolete postings.
  - **Super Administrators**: Create and manage administrator accounts, set institutional parameters, and inspect security audit logs.

---

## 2. Problem Statement

Higher education institutions face critical operational bottlenecks during recruitment drives:
1. **Manual Eligibility Verification**: Filtering hundreds of students based on CGPA thresholds, backlog limits, and branch restrictions is error-prone.
2. **Unverified Job Postings**: Fraudulent or unapproved job offers jeopardize student safety.
3. **Application Fragmentation**: Tracking applicant statuses across multiple recruiters creates communication gaps.
4. **Document Loss Across Sessions**: Misconfigured relative upload storage causes files to disappear across restarts.
5. **Lack of Screening Integration**: Recruiters require custom screening questions (notice period, location preference) prior to candidate shortlisting.

The VVITU Placement Portal solves these issues via automated matching rules, OCR degree verification, deterministic relative storage resolution, customizable screening questionnaires, and soft-delete capabilities.

---

## 3. Key Features

### Authentication & Security
- **Multi-Role RBAC**: `STUDENT`, `ALUMNI`, `ADMIN`, `SUPER_ADMIN`.
- **JWT Authentication**: Token transmission via HttpOnly cookies and authorization headers.
- **Password Security**: Hashing via `bcryptjs` (salt factor 10) with complexity policy checks.
- **IDOR Protection**: Endpoint ownership checks preventing users from inspecting or modifying foreign profiles.

### Student Capabilities
- **Dashboard & Placement Readiness**: Dynamic progress bar calculating profile completeness, CGPA status, and resume upload state.
- **Job Discovery & Matching Engine**: Filter jobs by company, job type, status, and department. Instant eligibility feedback based on CGPA and backlog criteria.
- **Resume Management & Skill Extraction**: PDF resume upload with automated skill extraction and inline PDF preview.
- **Pre-Application Screening Modal**: Custom questionnaire modal for job postings requiring screening answers.
- **Application Tracking**: Real-time status updates (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`).

### Alumni / Recruiter Capabilities
- **Job Posting & Editing**: Create rich job descriptions with eligibility rules, salary packages, openings, and company logos.
- **Degree Verification Upload**: Upload degree certificates verified via an automated OCR engine.
- **Applicant Management**: View candidate applications, inspect screening answers, download student resumes, and update hiring stages.
- **Job Deletion & Reposting**: Soft-delete obsolete job postings or edit active listings.

### Administrator Capabilities
- **Job Moderation & Management**: Review pending job posts (`APPROVE`, `REJECT`, `EXPIRED`, `DELETE`).
- **Student Directory & Bulk Actions**: Inspect student profiles, reset passwords, filter by verification status, and perform bulk export (`Excel`, `CSV`, `PDF`).
- **Alumni Verification Desk**: Review alumni verification documents, inspect OCR confidence scores, and verify accounts.
- **Placement Analytics**: Statistical summary widgets for active jobs, total applications, eligible candidate counts, and shortlisted candidates.

### Super Admin Capabilities
- **Admin Management**: Create new administrator accounts, assign designations, toggle active/suspended status, and reset admin passwords.

---

## 4. Application Workflow

```mermaid
flowchart TD
    A[User Enters Portal] --> B{Role Authenticated?}
    B -->|No| C[Login / Register]
    B -->|Yes| D{User Role}

    C -->|Student Register| E[Create Student Profile]
    C -->|Alumni Register| F[Upload Degree Doc & OCR Check]

    D -->|STUDENT| G[Student Dashboard]
    D -->|ALUMNI| H[Alumni Dashboard]
    D -->|ADMIN| I[Admin Dashboard]
    D -->|SUPER_ADMIN| J[Super Admin Panel]

    H --> K[Post New Job]
    K --> L[Job Marked PENDING]
    I --> M[Review Job Moderation Queue]
    M -->|Approve| N[Job Published - Status ACTIVE]
    M -->|Reject| O[Job Rejected with Reason]

    G --> P[Browse Active Jobs]
    P --> Q{Eligible?}
    Q -->|Yes| R[Fill Screening & Submit Application]
    Q -->|No| S[Eligibility Warning Displayed]

    H --> T[Review Applications & Screening Answers]
    T --> U[Update Application Stage: SHORTLISTED / SELECTED]
    
    I --> V[Manage Students, Verify Alumni & Delete Jobs]
    J --> W[Provision Admin Accounts & Audit Logs]
```

---

## 5. System Architecture

```text
                               +----------------------------------+
                               |     Browser Client (SPA)         |
                               | React 19 + Vite 6 + Tailwind v4  |
                               +----------------------------------+
                                                |
                                    HTTPS / REST API Requests
                                                |
                                                v
                               +----------------------------------+
                               |       Node.js + Express API      |
                               |    Port 8082 / Production Origin |
                               +----------------------------------+
                                   |            |            |
             +---------------------+            |            +---------------------+
             |                                  |                                  |
             v                                  v                                  v
+------------------------+          +-----------------------+          +------------------------+
|  JWT Auth & RBAC       |          |  Upload Storage       |          |  OCR Verification      |
|  Middleware            |          |  /uploads/{subfolder} |          |  Tesseract.js Engine   |
+------------------------+          +-----------------------+          +------------------------+
             |                                  |                                  |
             +---------------------+            |            +---------------------+
                                   |            |            |
                                   v            v            v
                               +----------------------------------+
                               |       Prisma ORM Client          |
                               +----------------------------------+
                                                |
                                                v
                               +----------------------------------+
                               |      PostgreSQL Database         |
                               +----------------------------------+
```

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React | `^19.0.0` | UI Component Framework |
| **Build System** | Vite | `^6.2.0` | Production Bundler & Dev Server |
| **Styling** | Tailwind CSS | `^4.1.14` | Utility-First CSS Engine |
| **Icons** | Lucide React | `^0.546.0` | UI Icons |
| **Routing** | React Router DOM | `^7.13.1` | Client-side SPA Routing |
| **HTTP Client** | Axios | `^1.18.1` | REST API Client & Interceptors |
| **PDF Rendering** | PDF.js | `^5.6.205` | Browser Canvas PDF Previewer |
| **Excel Export** | XLSX (SheetJS) | `^0.18.5` | Spreadsheet Export Engine |
| **Backend Runtime** | Node.js | `v18+` | Server Runtime Environment |
| **API Framework** | Express.js | `^4.21.2` | HTTP Server & REST API |
| **Database ORM** | Prisma | `^6.4.1` | Type-Safe Database Client |
| **Database Engine** | PostgreSQL | `v14+` | Relational Database Storage |
| **Auth & Security** | JWT & bcryptjs | `^9.0.2` / `^3.0.2` | Token Auth & Password Hashing |
| **File Processing** | Multer | `^1.4.5-lts.1` | Multipart Form File Uploads |
| **OCR Processing** | Tesseract.js | `^6.0.0` | Certificate Text Extraction |
| **Testing** | Jest & Vitest | `^29.7` / `^4.1` | Unit & Integration Test Runners |
| **Hosting** | Cloudflare Pages | Live | Frontend Static Edge Deployment |

---

## 7. Repository Directory Structure

```text
VVITU Placement Portal/
├── frontend/                        # React 19 + Vite Frontend Project
│   ├── public/                      # Static public assets (_redirects for SPA routing)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI components (Modal, JobCard, DeleteJobDialog, etc.)
│   │   │   └── layout/              # DashboardLayout, Sidebar, Header
│   │   ├── context/                 # DataContext.jsx (Global Image & Profile State)
│   │   ├── hooks/                   # Custom Hooks (useAuth, useDebounce, useDepartments)
│   │   ├── pages/
│   │   │   ├── admin/               # Admin pages (AdminDashboard, AdminJobs, AdminVerifications, etc.)
│   │   │   ├── alumni/              # Alumni pages (AlumniDashboard, AlumniPostJob, AlumniMyJobs, etc.)
│   │   │   ├── student/             # Student pages (StudentDashboard, StudentJobs, StudentProfile, etc.)
│   │   │   ├── Login.jsx            # Authentication Login Page
│   │   │   ├── Register.jsx         # Multi-role Registration Page
│   │   │   └── NotFound.jsx         # 404 Catch-All Page
│   │   ├── utils/                   # Client utilities (fileUrlResolver, imageUrl, axiosConfig, etc.)
│   │   ├── App.jsx                  # Main App Router & lazyWithRetry Dynamic Loading
│   │   └── main.jsx                 # Entry Point
│   ├── package.json
│   ├── vite.config.ts
│   └── wrangler.toml                # Cloudflare Pages Deployment Config
│
├── backend/                         # Node.js + Express Backend Project
│   ├── prisma/
│   │   └── schema.prisma            # Prisma Database Schema Definition
│   ├── scripts/                     # Maintenance & DB Seed Utility Scripts
│   ├── src/
│   │   ├── config/                  # Configuration (db.js, env.js)
│   │   ├── controllers/             # Express API Controllers
│   │   ├── middleware/              # Auth, Upload, Error, and Validation Middlewares
│   │   ├── routes/                  # Express Express API Routers
│   │   ├── services/                # Business Logic Layer (Auth, Student, Alumni, Admin, Job, OCR)
│   │   ├── utils/                   # File resolvers, password hashing, roll number parsing
│   │   └── app.js                   # Express Application Setup
│   ├── tests/                       # Jest Integration & Unit Test Suites (35 Test Suites)
│   ├── uploads/                     # Server File Storage (/images, /documents, /resumes, /job-logos)
│   ├── package.json
│   └── server.js                    # HTTP Server Entry Point
│
├── walkthrough.md                   # Feature Walkthrough Documentation
├── implementation_plan.md           # Technical Implementation Artifacts
└── README.md                        # Global Production Documentation
```

---

## 8. Frontend Architecture

- **Dynamic Module Chunk Loading (`lazyWithRetry`)**: Custom lazy import wrapper in `App.jsx` preventing stale chunk deployment errors. If a new production build redeploys with new hash names, chunk mismatches reload the page once automatically instead of crashing.
- **Robust Error Boundary**: `ErrorBoundary.jsx` catches rendering runtime errors and exposes a "Try Again" recovery action.
- **Universal File URL Resolver (`fileUrlResolver.js`)**: Converts relative file paths (`/uploads/images/...`, `documents/...`) or legacy URLs into active backend origin URLs without returning `null` or clearing local storage state.
- **State Management**:
  - `DataContext.jsx`: Manages active user profile image, force-refresh cache-busting, and sync with `localStorage`.
  - `useAuth`: Custom hook exposing JWT credentials, user roles, user names, and logout routines.

---

## 9. Backend Architecture

The backend follows a strict **Layered Controller-Service-Repository Architecture**:

```text
Client HTTP Request
       │
       ▼
Express Router (`/api/...`)
       │
       ▼
Middleware Layer (JWT Authentication, RBAC Authorization, Multer Uploads)
       │
       ▼
Controller Layer (`*Controller.js` - Extract Request, Form Response)
       │
       ▼
Service Layer (`*Service.js` - Validation, Business Logic, OCR Engine)
       │
       ▼
Prisma ORM Client (`prisma.*`)
       │
       ▼
PostgreSQL Database
```

- **Deterministic Upload Directory Resolution**: `env.uploadDir` resolves paths relative to `backend/__dirname` rather than process execution directory (`process.cwd()`), guaranteeing file persistence whether launched from repository root or server subdirectory.

---

## 10. Authentication & Authorization

- **Supported Roles**:
  - `STUDENT`: Access to student dashboard, profile, application tracking, job board.
  - `ALUMNI`: Access to alumni dashboard, job creation, candidate screening, applicant evaluation.
  - `ADMIN`: Access to job moderation, student directory, alumni verification, bulk export, job deletion.
  - `SUPER_ADMIN`: Access to admin account creation, permission management, audit logs.

- **Authentication Flow**:
  1. User submits credentials to `POST /api/auth/login`.
  2. `AuthService.login` verifies account status (`ACTIVE`) and checks `bcrypt` password hash.
  3. Server generates signed JWT token containing `userId`, `email`, and `role`.
  4. Token returned in JSON response and attached as HttpOnly cookie.
  5. Subsequent requests pass `Authorization: Bearer <token>`.

---

## 11. Core System Modules

### Student Module
- Profile management with branch, semester, CGPA, backlogs, academic year, and skills.
- PDF resume upload with automated skill extraction.
- Inline PDF document preview using canvas renderer with zoom/page controls.
- Automatic eligibility validation against job posting rules.

### Alumni Module & OCR Engine
- Alumni registration requiring passout year, company, designation, and degree certificate upload.
- Automated OCR verification engine analyzing degree images/PDFs using Tesseract text parsing to compare name, roll number, and institution against registration details.

### Admin & Moderation Module
- Moderation queue for job postings (`APPROVE`, `REJECT`).
- Soft-delete job capability (`DELETE /api/jobs/:id`).
- Student export module supporting customizable fields in `EXCEL`, `CSV`, and `PDF` formats.
- Super admin management panel to provision new administrators.

### Job Lifecycle & Application Workflows

```text
[Alumni Creates Job] ──> Status: PENDING
                               │
                               ▼
                    [Admin Moderation Review]
                    ┌──────────┴──────────┐
                    ▼                     ▼
             [Status: REJECTED]    [Status: APPROVED]
                                          │
                                          ▼
                               [Published - Status: ACTIVE]
                                          │
                                          ▼
                             [Student Fills Screening & Applies]
                                          │
                                          ▼
                             [Status: APPLIED in Database]
                                          │
                                          ▼
                            [Alumni/Admin Evaluates Candidate]
                            ┌─────────────┴─────────────┐
                            ▼                           ▼
                   [Status: SHORTLISTED]       [Status: SELECTED]
```

---

## 12. Resume & Document Handling

- **Upload Categories**:
  - `images/`: Student and alumni profile photos.
  - `documents/`: Alumni degree verification certificates.
  - `resumes/`: Student resume PDF documents.
  - `job-logos/`: Company brand logo uploads.
- **Physical File Resolver**: `resolveResumeFilePath` strips leading path variations (`/uploads/`, `resumes/`) and checks disk existence safely.
- **PDF Magic Byte Validation**: `DocumentViewerModal.jsx` checks the first 4 magic bytes (`%PDF-`) of blob responses. If a backend 404/JSON response is received, it extracts text gracefully and renders an error card **without passing ASCII text to PDF.js**.

---

## 13. Database Schema & Entity Relationships

```mermaid
erDiagram
    USER ||--o| STUDENT : "has student profile"
    USER ||--o| ALUMNI : "has alumni profile"
    USER ||--o| ADMIN_PROFILE : "has admin profile"
    STUDENT ||--o{ APPLICATION : "submits"
    JOB ||--o{ APPLICATION : "receives"
    ALUMNI ||--o{ JOB : "posts"
    STUDENT ||--o{ RESUME : "uploads"

    USER {
        bigint id PK
        string email
        string password
        string role
        string accountStatus
    }

    STUDENT {
        bigint id PK
        bigint userId FK
        string rollNumber
        string department
        float cgpa
        int backlogs
        boolean placementReady
    }

    ALUMNI {
        bigint id PK
        bigint userId FK
        string company
        string verificationStatus
        string verificationDocumentUrl
    }

    JOB {
        bigint id PK
        string title
        string companyName
        float requiredCgpa
        int maxBacklogs
        string status
        datetime deletedAt
    }

    APPLICATION {
        bigint id PK
        bigint jobId FK
        bigint studentId FK
        string status
        json screeningAnswers
    }
```

---

## 14. REST API Documentation

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/student` | Public | Register a new student account |
| `POST` | `/api/auth/register/alumni` | Public | Register alumni account with verification document |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT token |
| `POST` | `/api/auth/logout` | Public | Invalidate authentication session |
| `GET` | `/api/auth/me` | Authenticated | Retrieve active authenticated user profile |
| `PUT` | `/api/auth/change-password` | Authenticated | Change account password |

### Student Endpoints (`/api/student`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Required | `STUDENT` | Fetch academic & personal student profile |
| `PUT` | `/api/student/profile` | Required | `STUDENT` | Update student profile fields |
| `POST` | `/api/student/resume/upload` | Required | `STUDENT` | Upload resume PDF file |
| `GET` | `/api/student/resume/view` | Required | `STUDENT` | Stream resume PDF for inline browser preview |
| `POST` | `/api/student/apply` | Required | `STUDENT` | Submit job application with screening answers |
| `GET` | `/api/student/applications` | Required | `STUDENT` | Fetch student's submitted applications |

### Alumni Endpoints (`/api/alumni`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/alumni/profile` | Required | `ALUMNI` | Fetch alumni profile details |
| `GET` | `/api/alumni/my-jobs` | Required | `ALUMNI` | List jobs posted by active alumni |
| `GET` | `/api/alumni/jobs/:jobId/applications` | Required | `ALUMNI` | Fetch candidates for an alumni's job posting |

### Job Endpoints (`/api/jobs`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs/all` | Public | All | Fetch all jobs (with optional filters) |
| `GET` | `/api/jobs/approved` | Public | All | Fetch approved active jobs |
| `GET` | `/api/jobs/:id` | Public | All | Get detailed job posting information |
| `POST` | `/api/jobs/post` | Required | `ALUMNI`, `ADMIN` | Create a new job posting |
| `PUT` | `/api/jobs/:id` | Required | `ALUMNI`, `ADMIN` | Update job posting details |
| `DELETE`| `/api/jobs/:id` | Required | `ADMIN`, `SUPER_ADMIN`, `ALUMNI` | Soft-delete a job posting |

### Admin Endpoints (`/api/admin`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Required | `ADMIN` | Fetch dashboard aggregate placement statistics |
| `GET` | `/api/admin/users/students` | Required | `ADMIN` | List student directory |
| `PATCH` | `/api/admin/users/students/:id/approve` | Required | `ADMIN` | Verify/approve student profile |
| `GET` | `/api/admin/users/alumni` | Required | `ADMIN` | List alumni directory |
| `PATCH` | `/api/admin/users/alumni/:id/verify` | Required | `ADMIN` | Verify or reject alumni registration |
| `GET` | `/api/admin/alumni/:id/document` | Required | `ADMIN` | Stream alumni verification degree document |
| `POST` | `/api/admin/jobs/moderate/:id` | Required | `ADMIN` | Approve or reject pending job posting |
| `POST` | `/api/admin/users/students/export` | Required | `ADMIN` | Export student records (Excel, CSV, PDF) |

### Super Admin Endpoints (`/api/super-admin`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/super-admin/admins` | Required | `SUPER_ADMIN` | List administrator directory |
| `POST` | `/api/super-admin/admins` | Required | `SUPER_ADMIN` | Provision a new administrator account |
| `PUT` | `/api/super-admin/admins/:id` | Required | `SUPER_ADMIN` | Update administrator details or permissions |

---

## 15. Environment Setup & Configuration

Create a `.env` file inside `backend/` and `frontend/`:

### Backend Environment (`backend/.env`)
```env
PORT=8082
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/vvitu_placement_portal?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8082/api
```

---

## 16. Local Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher running locally or via cloud host

### Step 1: Clone Repository
```bash
git clone https://github.com/Prasanna-Anjaneyulu078/VVITU_Placement_Portal.git
cd "VVITU Placement Portal"
```

### Step 2: Backend Setup & Database Migration
```bash
cd backend
npm install

# Push Prisma schema to PostgreSQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Seed Super Admin Account
node scripts/reset-super-admin.js
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 4: Run Application Locally
- **Start Backend API Server**:
  ```bash
  cd backend
  npm run dev
  # Server starts on http://localhost:8082
  ```
- **Start Frontend Vite Dev Server**:
  ```bash
  cd frontend
  npm run dev
  # Frontend starts on http://localhost:5173
  ```

---

## 17. Automated & Manual Testing

### Backend Jest Test Suites
Execute full backend integration and unit tests (35 test suites, 255+ tests):
```bash
cd backend
npm test
```

### Frontend Vitest Test Suites
Execute frontend unit tests:
```bash
cd frontend
npm test
```

### Manual Verification Checklist
- [x] Multi-role registration & login (Student, Alumni, Admin, Super Admin)
- [x] Resume PDF upload & inline browser canvas viewing
- [x] Alumni degree document upload & OCR processing
- [x] Job creation, moderation (`APPROVE`, `REJECT`), and soft-deletion
- [x] Candidate eligibility check & pre-application screening modal submission
- [x] Bulk export of student records to Excel, CSV, and PDF

---

## 18. Security Architecture

- **IDOR Vulnerability Protection**: Endpoint authorization checks ensure users can only modify owned records.
- **Strict Role-Based Access Control**: Middleware enforces exact role permissions before executing controller logic.
- **Deterministic Storage Security**: File paths are validated against allowed subdirectories (`images/`, `documents/`, `resumes/`, `job-logos/`) to prevent path traversal attacks.
- **Soft Deletion Integrity**: Job deletions use soft-delete flags (`deletedAt`) to preserve relational integrity for student application records.

---

## 19. Error Handling & Reliability

- **Stale Chunk Auto-Recovery**: Frontend `lazyWithRetry` reloads the page seamlessly if a production deployment updates bundle chunk hashes.
- **Blob Error Decoding**: If binary document endpoints return a 404/500 JSON error, the frontend decodes ASCII text and renders a clean error card without crashing PDF.js.
- **401 Silent Token Expiry**: Expired JWT tokens trigger silent redirection to login without dumping error tracebacks into browser console.

---

## 20. Deployment Architecture

- **Frontend Deployment**: Hosted on **Cloudflare Pages** edge network.
  - **Live URL**: [https://vvitu-placement-portal.pages.dev](https://vvitu-placement-portal.pages.dev/)
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- **Backend API Deployment**: Node.js/Express service hosted on **Render** or Linux VPS.
  - **Production Origin**: `https://vvitu-placement-portal-api.onrender.com/api`

---

## 21. Known Limitations & Future Roadmap

### Known Limitations
- **Local Disk Upload Storage**: Uploaded files reside on local server disk storage; multi-region production scale requires S3/GCS bucket integration.
- **Single Institutional Scope**: Hardcoded for VVIT organizational structure.

### Future Roadmap
- [ ] AWS S3 / Google Cloud Storage Integration for distributed file assets.
- [ ] Automated Email & Push Notifications for application status updates.
- [ ] AI-Powered Resume Scoring & ATS Match Rate Recommendations.
- [ ] Real-time WebSocket Messaging between recruiters and applicants.

---

## 22. Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request.

---

## 23. License

No explicit license has been specified for this repository. All rights reserved by VVIT / Project Maintainers.

---

**Developed for Vasireddy Venkatadri Institute of Technology (VVIT)**  
*Maintained by Institutional Placement & Engineering Team*
