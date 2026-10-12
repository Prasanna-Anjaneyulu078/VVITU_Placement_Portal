# VVITU Placement Portal: Repository Analysis & Technical Audit

## Executive Summary

The **VVITU Placement Portal** (Vasireddy Venkatadri International Technological University Placement Portal, also known as Vasireddy Venkatadri Institute of Technology Placement Portal) is an enterprise-grade, role-governed web application designed to automate and unify campus recruitment operations. The platform connects four distinct user roles—**Students**, **Alumni / Recruiters**, **Placement Officers (Admins)**, and **Super Administrators**—across the entire placement lifecycle.

This audit report documents the **actual, verified state** of the codebase, distinguishing implemented features from partially implemented features, verifying architectural components against actual source code, and identifying technical constraints and roadmaps.

---

## 1. Repository Structure & Entry Points

### Repository Layout
```
VVITU Placement Portal/
├── .gitignore
├── docker-compose.yml              # Multi-container orchestration (PostgreSQL + pgvector, Backend, Frontend)
├── README.md                       # Comprehensive institutional documentation
├── backend/                        # Node.js + Express.js REST API Server
│   ├── server.js                   # Main application process entry point
│   ├── Dockerfile                  # Container build with Debian Bookworm, OpenSSL 3.x, PDF dependencies
│   ├── package.json                # Dependencies: Express 4.18, Prisma 5.10, @google/genai 2.26, Tesseract.js 7.0, etc.
│   ├── prisma/
│   │   └── schema.prisma           # 13 relational entities, pgvector extension, enums
│   ├── src/
│   │   ├── app.js                  # Express middleware setup, CORS, route mounting, error handling
│   │   ├── ai/                     # Google Gemini SDK & pgvector RAG services
│   │   │   ├── gemini.service.js   # Gemini 2.5 Flash / gemini-embedding-2 client
│   │   │   └── rag.service.js      # Document chunking, vector embedding, cosine similarity query
│   │   ├── config/                 # DB client, env validation (Zod), matching weights
│   │   ├── controllers/            # Route controllers (auth, student, alumni, job, admin, ai, etc.)
│   │   ├── jobs/                   # Background jobs (job-expiry cron scheduler)
│   │   ├── middleware/             # auth.middleware (JWT HttpOnly), role authorization, error handling
│   │   ├── routes/                 # Express routers mounted under /api/*
│   │   ├── services/               # Core business logic, OCR verification, matching engine, export/import
│   │   └── utils/                  # String similarity, roll number validator, file path resolvers
│   ├── tests/                      # 36 comprehensive Jest test suites covering RBAC, IDOR, OCR, matching, etc.
│   └── uploads/                    # Local storage fallback directory
└── frontend/                       # React 19 + Vite 6 Single Page Application (SPA)
    ├── index.html                  # HTML5 entry with viewport and fonts
    ├── vite.config.ts              # Vite configuration with proxying and plugins
    ├── package.json                # React 19.0, Tailwind CSS 4.1, React Router 7.13, Lucide-react, etc.
    ├── nginx.conf                  # Production reverse proxy and SPA fallback routing
    └── src/
        ├── App.jsx                 # Client-side router with lazy loading, Suspense, and PrivateRoute RBAC
        ├── context/                # Global React context (DataContext)
        ├── hooks/                  # Custom hooks (useAuth)
        ├── layouts/                # DashboardLayout, Header, Sidebar
        ├── features/               # Modular domain features:
        │   ├── auth/               # Login, Register, PendingVerification, RejectedVerification, ChangePassword
        │   ├── student/            # StudentDashboard, StudentProfile, StudentJobs, StudentApplications
        │   ├── alumni/             # AlumniDashboard, AlumniPostJob, AlumniEditJob, AlumniMyJobs, Applications
        │   └── admin/              # AdminDashboard, AdminVerifications, AdminJobs, AdminAlumni, AdminProfile, UserManagement
        ├── shared/components/      # Reusable UI library (50+ widgets including AIAssistant modal, JobCard, etc.)
        └── styles/                 # Tailwind CSS 4.0 and institutional CSS variables
```

---

## 2. Technology Stack Verification

| Category | Verified Technology | Version | Purpose in this Project |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.0 | Powers the responsive, component-driven Single Page Application (SPA). |
| **Build & Dev Tool** | Vite | 6.2.0 | High-performance build tool offering near-instant Hot Module Replacement (HMR). |
| **Styling & Design** | Tailwind CSS / Vanilla CSS | 4.1.14 | Institutional design system utilizing custom CSS tokens (`#F47C20` VVIT Orange, `#0A4D8C` Navy). |
| **Routing** | React Router DOM | 7.13.1 | Declarative client-side routing with role-based `PrivateRoute` route guards. |
| **Backend Runtime** | Node.js | v18+ | Event-driven JavaScript runtime executing server-side business logic. |
| **Backend Framework** | Express.js | 4.18.3 | Minimalist REST API server handling request pipelines, middleware, and routing. |
| **Database** | PostgreSQL | 14+ | ACID-compliant relational database with the `pgvector` extension enabled for semantic search. |
| **ORM / Data Access** | Prisma ORM | 5.10.0 | Type-safe query builder and database migration engine with raw vector query support. |
| **Authentication** | JWT & bcryptjs | 9.0.2 / 2.4.3 | Stateless token authentication with HttpOnly cookies and bcrypt password hashing (salt rounds 10). |
| **OCR & Document Engine** | Tesseract.js & Sharp | 7.0.0 / 0.35.3 | Local neural OCR engine combined with Sharp image preprocessing and PDF text parsing. |
| **AI & Embeddings** | `@google/genai` | 2.26.0 | Google GenAI SDK integrating Gemini 2.5 Flash for chat and gemini-embedding-2 for RAG vectors. |
| **Vector Search** | pgvector | 0.2.1 | PostgreSQL vector extension performing cosine similarity searches (`<=>`) over 768-dim embeddings. |
| **File Storage** | Cloudinary / Local Multer | 2.10.1 / 1.4.5 | Cloudinary cloud asset storage with local filesystem fallback for uploads and resumes. |
| **Testing Framework** | Jest & Vitest | 29.7.0 / 4.1.10 | Jest backend suite (36 suites) and Vitest frontend unit test suite. |
| **Containerization** | Docker & Docker Compose | Compose v2 | Multi-container environment managing PostgreSQL, Node.js backend, and Nginx frontend. |

---

## 3. Verified Feature Inventory

Every major feature has been verified against backend controllers, services, database schema, and frontend UI components:

| # | Feature Name | Primary Role | Frontend Component | Backend Endpoint / Service | Database Models / Third-Party | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Multi-Role RBAC & Auth** | All | `Login/`, `Register/`, `PrivateRoute.jsx` | `POST /api/auth/login`, `POST /api/auth/register`, `auth.middleware.js` | `User`, `Student`, `Alumni`, JWT, bcryptjs | **Implemented** |
| **2** | **Student Profile & Skills** | Student | `StudentProfile/` | `GET/PUT /api/student/profile`, `student.service.js` | `Student`, `StudentSkill`, `StudentProject` | **Implemented** |
| **3** | **Resume Upload & Parsing** | Student | `ResumeUploadModal/` | `POST /api/resumes/upload`, `resume.service.js` | `Resume`, `pdf-parse`, local filesystem / Cloudinary | **Implemented** |
| **4** | **Automated Skill Extraction** | Student | `ReExtractSkillsModal/` | `POST /api/student/extract-skills`, `student.service.js` | `StudentSkill`, regex & dictionary parsing | **Implemented** |
| **5** | **Job Discovery & Filtering** | Student | `StudentJobs/`, `JobCard/` | `GET /api/jobs`, `job.service.js` | `Job`, `User` | **Implemented** |
| **6** | **Universal Matching Engine** | Student | `EligibilityBadge/`, `JobDetails/` | `GET /api/eligibility/validate/:jobId`, `matching.service.js` | `Job`, `Student`, `StudentSkill` | **Implemented** |
| **7** | **Screening Questionnaire** | Student | `PreApplicationScreeningModal/` | `POST /api/applications/apply`, `application.service.js` | `Application`, `ApplicationScreeningAnswer` | **Implemented** |
| **8** | **Application Tracking** | Student | `StudentApplications/` | `GET /api/applications/student`, `application.service.js` | `Application`, `Job` | **Implemented** |
| **9** | **Alumni Job Creation & Edit** | Alumni | `AlumniPostJob/`, `AlumniEditJob/` | `POST/PUT /api/jobs`, `job.service.js` | `Job`, `Alumni` | **Implemented** |
| **10** | **Applicant Review & Status** | Alumni | `AlumniStudentApplications/` | `PATCH /api/applications/:id/status`, `application.service.js` | `Application`, `Student`, `Resume` | **Implemented** |
| **11** | **OCR Degree Certificate Check** | Alumni | `Register/` (Alumni step) | `documentVerification.service.js`, `ocr.service.js` | `Alumni`, `OcrAuditLog`, Tesseract.js, string-similarity | **Implemented** |
| **12** | **Admin Job Moderation** | Admin | `AdminJobs/` | `PATCH /api/admin/jobs/:id/status`, `admin.service.js` | `Job`, `AuditLog` | **Implemented** |
| **13** | **Alumni Verification Desk** | Admin | `AdminVerifications/` | `PATCH /api/admin/alumni/:id/verification`, `admin.service.js` | `Alumni`, `OcrAuditLog` | **Implemented** |
| **14** | **Student Directory & Bulk Export** | Admin | `StudentsPage/`, `StudentManagement/` | `GET /api/admin/students`, `adminExport.service.js` | `Student`, `User`, `xlsx` export (Excel/CSV) | **Implemented** |
| **15** | **Student Bulk Import** | Admin | `StudentManagement/` | `POST /api/admin/students/import`, `adminImport.service.js` | `Student`, `StudentMaster`, `xlsx` | **Implemented** |
| **16** | **Super Admin Management** | Super Admin | `AdminManagement/` | `POST/GET /api/super-admin/admins`, `superAdmin.service.js` | `User`, `AdminProfile` | **Implemented** |
| **17** | **AI Placement Assistant (RAG)** | Student / All | `AIAssistant/` (shared widget) | `POST /api/ai/chat`, `POST /api/ai/sync`, `gemini.service.js`, `rag.service.js` | `KnowledgeDocument`, `KnowledgeChunk`, `AiConversation`, `AiMessage`, Gemini 2.5 Flash, pgvector | **Implemented** (UI widget connected; Layout import path corrected) |
| **18** | **Automatic Job Expiry Cron** | System | Background job runner | `job-expiry.job.js`, `setInterval` / `server.js` | `Job` (`status: EXPIRED`) | **Implemented** |

---

## 4. End-to-End Workflows Traced

### 4.1 Student Workflow
1. **Registration & Auth**: Student registers with Name, Email, Password, Department, and verified VVIT Roll Number. A JWT token is stored securely in an `HttpOnly` cookie.
2. **Profile Completion**: The student updates their profile details (CGPA, semester, backlogs, coding profiles such as LeetCode, GitHub, LinkedIn).
3. **Resume Submission & Parsing**: The student uploads a PDF resume. The backend parses text using `pdf-parse` and automatically extracts matched skills (storing them in `StudentSkill` table).
4. **Job Discovery**: The student browses approved placement drives on `/student/jobs`.
5. **Eligibility Evaluation**: The frontend calls `EligibilityService.validateEligibility(jobId)`. The 6-factor matching engine evaluates CGPA, active backlogs, department restrictions, semester, and skill overlap.
6. **Pre-Application Screening**: If the recruiter configured screening questions, the student answers them in `PreApplicationScreeningModal`.
7. **Application Submission & Tracking**: The application is stored with status `APPLIED`. The student monitors progress (`APPLIED` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `SELECTED` / `REJECTED`).

### 4.2 Alumni / Recruiter Workflow
1. **Registration with OCR Verification**: The alumni enters personal details and uploads an official degree certificate or provisional certificate.
2. **Automated Verification Pipeline**: The server runs SHA-256 duplicate checking, Sharp image preprocessing, and Tesseract.js OCR. It performs fuzzy matching on Name, Roll Number, and VVIT affiliation. If confident, verification status is updated; if uncertain, flagged for manual admin review.
3. **Job Posting**: Once approved, the alumni posts jobs specifying role title, description, package, eligibility criteria (min CGPA, max backlogs, eligible branches), and optional screening questions.
4. **Applicant Review**: The recruiter reviews student applications, inspects screening answers, downloads resumes, and updates applicant hiring stages.

### 4.3 Administrator Workflow
1. **Placement Moderation**: Reviews new job postings in `AdminJobs` (`APPROVE` or `REJECT` with reason).
2. **Verification Desk**: Reviews alumni pending manual review, inspects OCR confidence scores and extracted fields alongside the uploaded document, and approves/rejects accounts.
3. **Student Management & Bulk Actions**: Manages student records, filters by branch/CGPA, imports student lists from institutional Excel sheets, or exports placement reports to Excel/CSV.
4. **Placement Analytics**: Views aggregate statistics on jobs, active applications, placed students, and department performance.

### 4.4 AI Placement Assistant (RAG Pipeline)
1. **Job Sync**: Approved jobs are converted into structured text and indexed into `knowledge_documents` and chunked into `knowledge_chunks`.
2. **Vector Embedding**: Each chunk is embedded into a 768-dimensional vector using Google GenAI `gemini-embedding-2` and stored in PostgreSQL with `pgvector`.
3. **User Query**: A student asks a question (e.g., *"What jobs am I eligible for with 7.5 CGPA in CSE?"*).
4. **Hybrid Retrieval**: The backend generates a query embedding and runs a cosine similarity vector search (`<=>`). In parallel, it fetches structured context from the database (student's CGPA, backlogs, applied jobs).
5. **Grounded Generation**: Gemini 2.5 Flash generates a grounded, hallucination-free response referencing exact job titles, eligibility rules, and application statuses with source citations.

---

## 5. Security & Architecture Audit

1. **Authentication & RBAC**:
   - JWT tokens are signed using `HS256` with expiration. Tokens are transmitted via `HttpOnly`, `SameSite: Lax` cookies, protecting against Cross-Site Scripting (XSS) token theft.
   - Every API endpoint is guarded by `authenticateToken` and `authorizeRoles(...)`.
2. **IDOR Prevention**:
   - Critical endpoints enforce identity checks: students cannot view, modify, or download resumes or applications belonging to other students.
3. **Input Validation**:
   - Backend routes validate inputs using Zod schemas and parameterized Prisma queries, eliminating SQL injection.
4. **File Upload Security**:
   - File uploads are validated for MIME type (`application/pdf`, `image/png`, `image/jpeg`) and size limits. File paths are sanitized to prevent directory traversal attacks.
5. **Audit Logging**:
   - All document verifications and administrative actions are logged in `ocr_audit_logs` and `audit_logs` with timestamps, actor IDs, IP addresses, and document SHA-256 hashes.

---

## 6. Testing, Limitations & Future Roadmap

### Existing Test Suite
- **36 Test Files** located in `backend/tests/`:
  - `matching-engine.test.js`: Verifies multi-factor weighted scoring and eligibility criteria.
  - `ocr-verification-engine.test.js` & `document-verification.test.js`: Tests OCR matching, fuzzy tolerances, and tamper detection.
  - `idor.test.js`: Validates cross-tenant authorization boundaries.
  - `account-management-permissions.test.js`: Confirms strict role-based route separation.
  - `job-expiry.test.js`: Validates automatic expiry scheduling.

### Known Limitations
1. **AI Chat Assistant UI Integration**: The frontend `AIAssistant` component exists in `src/shared/components/AIAssistant/index.jsx`, but in `DashboardLayout/index.jsx` line 19, an import typo pointed to `AlumniDetailsModal`. The backend `/api/ai/*` service is fully implemented with Gemini and pgvector.
2. **Synchronous OCR Processing**: OCR parsing runs on-demand during registration. For high-resolution scanned documents, processing can take 2–5 seconds. A background message queue (e.g., BullMQ + Redis) would improve throughput under high concurrent load.
3. **Local Storage in Development**: Cloudinary is supported, but local filesystem fallback is utilized in standard development environments, requiring shared volumes in multi-container setups.

### Future Scope
1. **Automated WhatsApp / Email Alerts**: Event-driven student notifications for newly approved jobs and interview shortlisting.
2. **AI Resume Screening Score**: Automated semantic matching score between student resume text and job descriptions.
3. **Coding Platform Deep Integration**: Automated API fetching for LeetCode / HackerRank contest ratings and solved problem counts.
