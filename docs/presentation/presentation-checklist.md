# VVITU Placement Portal: Presentation Checklist & Live Demo Guide

This checklist provides a final verification protocol for the project review, along with a live demonstration script and recommended screenshots.

---

## 1. Pre-Presentation Verification Protocol

- [x] **Technical Stack Verified**:
  - React 19.0.0 & Vite 6.2.0 confirmed in [frontend/package.json](file:///d:/Projects/VVITU%20Placement%20Portal/frontend/package.json).
  - Node.js & Express 4.18.3 confirmed in [backend/package.json](file:///d:/Projects/VVITU%20Placement%20Portal/backend/package.json).
  - PostgreSQL 14+ with Prisma 5.10.0 and pgvector extension confirmed in [backend/prisma/schema.prisma](file:///d:/Projects/VVITU%20Placement%20Portal/backend/prisma/schema.prisma).
  - Google Gemini 2.5 Flash & `gemini-embedding-2` confirmed in [gemini.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/ai/gemini.service.js).
  - Tesseract.js 7.0 & Sharp confirmed in [ocr.service.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/src/services/ocr.service.js).
- [x] **Database Constraints Audited**:
  - 13 Prisma models verified with foreign key cascades, soft delete columns (`deletedAt`), and 768-dim vector column.
- [x] **Security Posture Checked**:
  - JWT tokens stored in HttpOnly cookies.
  - Role-Based Access Control verified across 4 distinct roles.
  - IDOR protection verified via [backend/tests/idor.test.js](file:///d:/Projects/VVITU%20Placement%20Portal/backend/tests/idor.test.js).
- [x] **Academic Integrity & Honest Disclosures**:
  - Synchronous OCR execution accurately identified as a current architectural bottleneck for large files.
  - AI chat frontend modal verified and layout import updated.
  - Future scope clearly delineated from implemented capabilities.

---

## 2. Recommended Screenshots for PPT Transfer

When generating the final slide deck or presenting to the committee, capture and insert the following verified live views:

| # | Slide Target | Recommended Screenshot Content | Navigation / UI Path |
| :--- | :--- | :--- | :--- |
| **1** | **Slide 1 / 2** | Institutional Login Portal with VVITU Crest & Branding | `/login` |
| **2** | **Slide 6 / 7** | Student Dashboard showing Placement Readiness Progress Bar & CGPA Card | `/student/dashboard` |
| **3** | **Slide 7 / 8** | Student Resume Upload Modal & Automatically Extracted Technology Skills | `/student/profile` ➔ Skills Section |
| **4** | **Slide 8** | Job Listings Screen displaying "Eligible" / "Not Eligible" Status Badges | `/student/jobs` |
| **5** | **Slide 8** | Pre-Application Screening Questionnaire Modal | `/student/jobs/:id` ➔ Click "Apply" |
| **6** | **Slide 12** | AI Placement Assistant Modal with Interactive Source Citation Badges | Floating Assistant Widget on Dashboard |
| **7** | **Slide 13** | Alumni Degree Upload Screen during Registration | `/register` (Select Alumni Role) |
| **8** | **Slide 13** | Admin Alumni Verification Desk showing Side-by-Side OCR Confidence & Document | `/admin/verifications` |
| **9** | **Slide 14** | Admin Job Moderation Queue approving a drive | `/admin/jobs` |
| **10**| **Slide 15** | Admin Student Directory with Bulk Excel Export / Import modal | `/admin/students` |

---

## 3. Step-by-Step Live Demonstration Script

Follow this sequential walkthrough during the live project demonstration to showcase all key workflows within 5–7 minutes:

### Step 1: Institutional Authentication & Role Separation (1 Minute)
1. Navigate to `http://localhost:5173/login`.
2. Highlight the official VVITU branding, responsiveness, and clean aesthetic.
3. Show that unauthorized direct URL navigation to `/admin/dashboard` or `/student/dashboard` immediately triggers `PrivateRoute` redirects back to `/login`.

### Step 2: Student Journey & Intelligent Matching (2 Minutes)
1. Log in with a verified student account.
2. Show the **Student Dashboard**: point out the profile completeness indicator, CGPA, and backlog counters.
3. Navigate to **Profile**: show the uploaded resume. Click "Re-extract Skills" to demonstrate `pdf-parse` instantly extracting skills into database tags.
4. Navigate to **Jobs**: show the dynamic **Eligibility Badges**. Click on a job to open `JobDetails`.
5. Point out the explainable match score breakdown (e.g., 85% match, highlighting branch eligibility and skill overlap).
6. Click "Apply": showcase the **Pre-Application Screening Modal** with customized recruiter questions. Submit the application.
7. Navigate to **Applications**: show the real-time status tracker (`APPLIED`).

### Step 3: AI Placement Assistant in Action (1.5 Minutes)
1. Open the floating **AI Placement Assistant** widget.
2. Type: *"What jobs am I eligible for?"*
3. Demonstrate the grounded response: explain to evaluators that the assistant queried `pgvector` for job requirements, merged the student's actual CGPA and CSE branch from PostgreSQL, and generated a factual response via Gemini 2.5 Flash with zero hallucination.
4. Point out the clickable source citations displayed below the message.

### Step 4: Alumni Registration & OCR Verification (1.5 Minutes)
1. Open an incognito browser window and navigate to `/register`.
2. Select **Alumni Registration**. Enter Name, Roll Number, and upload a sample VVIT degree certificate.
3. Submit registration: highlight the real-time OCR status.
4. Explain how Tesseract.js and Sharp extracted text, verified the VVIT affiliation, and matched the name/roll number.
5. If the document matches, show instant verification; if borderline, show how it transitions to `PENDING_MANUAL_REVIEW`.

### Step 5: Administrator Placement & Reporting Desk (1 Minute)
1. Log in as an **Admin** (`admin@vvit.net`).
2. Show the **Admin Dashboard**: display aggregate placement metrics.
3. Navigate to **Verifications**: inspect the uploaded alumni certificate, showing the OCR confidence score and side-by-side verification buttons.
4. Navigate to **Students**: demonstrate filtering by branch/CGPA and click "Export to Excel" to download a clean `.xlsx` placement report.
5. Conclude the demonstration and transition to committee Q&A.
