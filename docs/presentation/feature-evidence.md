# VVITU Placement Portal: Feature-to-Code Evidence Mapping

This document provides a **line-by-line and file-level verification matrix** connecting every architectural claim, slide statement, and feature to the actual implementation within the VVITU Placement Portal codebase.

---

## 1. Authentication, Security & RBAC Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Multi-Role RBAC Support** | [schema.prisma](file:///d:/Projects/VVITU%20Placement%20Portal/backend/prisma/schema.prisma#L13-L18) | `enum Role` | Declares `ADMIN`, `SUPER_ADMIN`, `STUDENT`, `ALUMNI`. |
| **HttpOnly Cookie JWT** | [auth.controller.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/controllers/auth.controller.js) | `login` | Sets cookie: `res.cookie('token', token, { httpOnly: true, secure: ..., sameSite: 'lax' })`. |
| **Bcrypt Password Hashing** | [auth.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/auth.service.js) | `hashPassword`, `comparePassword` | Uses `bcrypt.hash(password, 10)` and `bcrypt.compare`. |
| **Route Protection & Roles** | [auth.middleware.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/middleware/auth.middleware.js) | `authenticateToken`, `authorizeRoles` | Extracts token from cookies or `Authorization: Bearer`, verifies JWT, checks `req.user.role`. |
| **Frontend RBAC Route Guards** | [PrivateRoute.jsx](file:///d:/Projects/VVITU%20Placement%20Portal/frontend/src/shared/components/PrivateRoute/index.jsx) | `PrivateRoute` | Redirects unauthenticated users to `/login` and role-mismatched users to unauthorized views. |
| **IDOR Vulnerability Protection** | [backend/tests/idor.test.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/tests/idor.test.js) | Automated Test Suite | Validates that Student A receives 403 Forbidden when requesting Student B's resume or applications. |

---

## 2. Student & Resume Management Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Student Profile Management** | [student.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/student.service.js) | `getProfile`, `updateProfile` | Updates CGPA, backlogs, department, mobile, and coding links (`leetcodeUrl`, `githubUrl`, etc.). |
| **VVIT Roll Number Validation** | [vvitRollNumberUtils.js](file:///d:/Projects/VVITU%20Placement%20Portal/frontend/src/utils/vvitRollNumberUtils.js#L14-L46) | `validateVVITRollNumber` | Enforces institutional roll number syntax (e.g., standard branch prefixes and batch digits). |
| **PDF Resume Upload & Persistence** | [resume.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/resume.service.js#L8-L74) | `uploadResume` | Resolves relative file paths, manages database replacement, and cleans up superseded physical files. |
| **Automated Skill Extraction** | [student.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/student.service.js) | `reExtractSkills` | Parses PDF text buffer via `pdf-parse` and extracts matches against predefined technology dictionary. |
| **Student Application Tracking** | [application.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/application.service.js) | `getStudentApplications` | Returns applications mapped with associated `Job` and recruitment status badges. |

---

## 3. Job Lifecycle & Recruiter Workflows Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Job Creation with Criteria** | [job.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/job.service.js) | `createJob` | Persists `title`, `companyName`, `requiredCgpa`, `maxBacklogs`, `eligibleDepartments`, and `status: PENDING`. |
| **Job Moderation Pipeline** | [admin.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/admin.service.js) | `updateJobStatus` | Allows admins to set status to `APPROVED` or `REJECTED` with custom rejection reason string. |
| **Pre-Application Screening** | [application.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/application.service.js) | `applyForJob` | Validates mandatory answers and inserts into `ApplicationScreeningAnswer` table linked to `Application`. |
| **Automatic Job Expiry Cron** | [job-expiry.job.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/jobs/job-expiry.job.js) | `initJobExpiryScheduler` | Runs periodic background queries updating jobs where `applicationDeadline < NOW()` to `EXPIRED`. |
| **Applicant Review by Alumni** | [alumni.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/alumni.service.js) | `getJobApplicants` | Fetches student candidate profiles, screening responses, and resume download links for a specific job. |

---

## 4. 6-Factor Eligibility & Matching Engine Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Dynamic Multi-Factor Matching** | [matching.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/matching.service.js#L53-L87) | `calculateJobMatch` | Computes weighted sum: Skills (50%), Education (15%), Branch (10%), Experience (10%), Eligibility Checks (10%), Certifications (5%). |
| **CGPA Threshold Checking** | [eligibility.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/eligibility.service.js#L44-L70) | `checkCgpaEligibility` | Evaluates `student.cgpa >= job.requiredCgpa` with exact precision. |
| **Backlog Constraint Verification** | [eligibility.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/eligibility.service.js#L72-L90) | `checkBacklogsEligibility` | Verifies `student.backlogs <= job.maxBacklogs`. |
| **Branch / Department Matcher** | [departmentMatcher.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/utils/departmentMatcher.js) | `matchDepartment` | Matches student department against comma-separated allowed list (e.g., `CSE, IT, ECE`). |
| **Explainable Failure Checklist** | [matching.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/matching.service.js#L93-L100) | `failedReasons` | Compiles plain-English breakdown explaining why an applicant is ineligible. |

---

## 5. OCR Document Verification Engine Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Tamper & Duplicate Detection** | [documentVerification.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/documentVerification.service.js#L85-L97) | `validateRegistrationData` | Computes SHA-256 hash using `crypto.createHash('sha256')`; rejects if already verified in `ocr_audit_logs`. |
| **Neural OCR Extraction** | [ocr.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/ocr.service.js#L90-L100) | `runTesseract` | Spawns `tesseract.js` worker with `tessedit_pageseg_mode: 3` and English OCR language model. |
| **Institutional College Match** | [documentVerification.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/documentVerification.service.js#L307-L359) | `verifyCollege` | Searches for patterns `VVITU`, `VASIREDDY VENKATADRI`, `VVIT GUNTUR`, with fuzzy tolerance. |
| **Roll Number Extraction** | [documentVerification.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/documentVerification.service.js#L369-L380) | `verifyRollNumber` | Normalizes uppercase alphanumeric string and extracts matching candidate tokens. |
| **Fuzzy Name Similarity** | [documentVerification.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/documentVerification.service.js#L145) | `verifyName` | Uses `string-similarity` to calculate Dice coefficient similarity against form input name. |
| **Decision Engine Matrix** | [documentVerification.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/documentVerification.service.js#L194-L302) | `determineVerificationResult` | Classifies outcome into `VERIFIED`, `REJECTED`, or `PENDING_MANUAL_REVIEW`. |

---

## 6. AI Placement Assistant & RAG Pipeline Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Google GenAI Client Setup** | [gemini.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/gemini.service.js#L1-L15) | `GeminiService` constructor | Imports `GoogleGenAI` from `@google/genai`; initializes `gemini-2.5-flash` and `gemini-embedding-2`. |
| **Vector Embedding Generation** | [gemini.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/gemini.service.js#L17-L29) | `generateEmbedding` | Calls `this.ai.models.embedContent({ model: 'gemini-embedding-2', contents: text })`. |
| **Job Chunker & pgvector Insert** | [rag.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/rag.service.js#L32-L86) | `indexJob` | Chunks text, generates embeddings, and executes `INSERT INTO knowledge_chunks ... VALUES ($1, $2, $3::vector)`. |
| **Cosine Similarity Vector Search** | [rag.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/rag.service.js#L91-L107) | `searchSimilar` | Runs raw SQL: `ORDER BY kc.embedding <=> $1::vector LIMIT $2` where `<=>` is pgvector cosine distance. |
| **Hybrid Structured Context** | [rag.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/rag.service.js#L125-L157) | `fetchStructuredContext` | Injects student profile (CGPA, backlogs) and actual submitted application statuses into the prompt context. |
| **Zero-Hallucination Guardrails** | [ai.controller.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/controllers/ai.controller.js#L6-L15) | `SYSTEM_PROMPT` | Enforces: "Answer ONLY using RETRIEVED CONTEXT and STRUCTURED DATABASE CONTEXT... DO NOT invent or hallucinate". |

---

## 7. Administrative Moderation & Export Evidence

| Architectural Claim | Implementation File | Key Functions / Symbols | Code Evidence & Details |
| :--- | :--- | :--- | :--- |
| **Bulk Student Excel Export** | [adminExport.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/adminExport.service.js) | `exportStudents` | Reads filtered student list and generates Excel workbook via `xlsx` library. |
| **Bulk Student Excel Import** | [adminImport.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/adminImport.service.js) | `importStudents` | Parses uploaded `.xlsx`/`.csv` spreadsheet, validates roll numbers, and bulk-inserts student records. |
| **Alumni Verification Desk** | [AdminVerifications/index.jsx](file:///d:/Projects/VVITU%20Placement%20Portal/frontend/src/features/admin/pages/AdminVerifications/index.jsx) | `AdminVerifications` component | Allows admins to inspect uploaded certificates side-by-side with OCR extracted values and approve/reject. |
| **Super Admin Management** | [superAdmin.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/superAdmin.service.js) | `createAdmin`, `getAllAdmins` | Manages creation of users with `Role.ADMIN` and creates associated `AdminProfile`. |
