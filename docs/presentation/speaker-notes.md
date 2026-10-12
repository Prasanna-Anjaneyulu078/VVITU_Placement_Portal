# VVITU Placement Portal: Speaker Notes & Presentation Guide

This guide provides verbatim, presentation-ready speaker notes tailored for a B.Tech final-year major project review. It balances technical depth, architectural rationale, and clear academic delivery.

---

### Slide 1: Title Slide
**Speaker Notes:**
> "Good morning respected external examiner, head of the department, project coordinator, and faculty members. Welcome to the major project viva-voce presentation of our B.Tech final-year project titled **'VVITU Placement Portal: An Enterprise Campus Placement & Recruitment Management System'**.
> 
> Our team set out to engineer a scalable, production-ready software solution for Vasireddy Venkatadri International Technological University (VVITU) that transforms traditional, manual placement procedures into an automated, role-governed digital ecosystem. In addition to full-stack workflow automation, our project integrates neural OCR document verification and a Retrieval-Augmented Generation (RAG) AI placement assistant."

---

### Slide 2: Project Abstract
**Speaker Notes:**
> "To give you an executive overview, campus placements at an institution of our size involve thousands of students, hundreds of hiring partners, and rigorous compliance checks. Managing this through spreadsheets and ad-hoc communication leads to data inconsistencies and administrative bottlenecks.
> 
> Our platform unifies four distinct user groups: Students, Alumni Recruiters, Placement Officers, and Super Administrators. Key innovations include:
> 1. An automated 6-factor matching engine that instantly computes student eligibility and match scores.
> 2. An on-premise neural OCR verification pipeline powered by Tesseract.js that verifies alumni degree certificates during registration.
> 3. A grounded AI Placement Assistant using Google Gemini 2.5 Flash and PostgreSQL pgvector to answer candidate queries without hallucinations.
> All components have been implemented, verified, and backed by automated test suites."

---

### Slide 3: Problem Statement & Challenges
**Speaker Notes:**
> "Before architecting the system, we identified the root operational problems faced by our placement cell:
> - **First, Manual Eligibility Screening:** When a company requests students with a 7.5 CGPA, zero backlogs, and specific branches, coordinators manually filter spreadsheets. This is slow and error-prone.
> - **Second, Unverified Recruiter Credentials:** In open portals, unauthorized individuals can post fake jobs. Verifying recruiter credentials manually creates heavy friction.
> - **Third, Application Fragmentation:** Students often miss interview schedules and shortlist statuses because communication is scattered across email threads and WhatsApp groups.
> - **Fourth, Lack of Pre-Screening:** Companies often need immediate answers to specific questions—such as willingness to relocate or bond agreements—before reviewing resumes.
> The VVITU Placement Portal was engineered specifically to solve each of these problems through software automation."

---

### Slide 4: Project Objectives
**Speaker Notes:**
> "Based on these challenges, we established five concrete project objectives:
> 1. Implement strict multi-role Role-Based Access Control (RBAC) across four user levels, ensuring strict data privacy and IDOR protection.
> 2. Design a dynamic, multi-factor job eligibility and skill-matching engine that provides real-time explainable feedback to students.
> 3. Build an automated degree certificate verification system using Tesseract.js, Sharp image preprocessing, and fuzzy string matching.
> 4. Deploy a Retrieval-Augmented Generation (RAG) AI assistant combining Google GenAI and pgvector semantic search.
> 5. Equip placement officers with bulk management tools, including Excel student import and export capabilities."

---

### Slide 5: Existing System vs. Proposed Solution
**Speaker Notes:**
> "Let us examine how our proposed platform compares with the existing system:
> In the existing workflow, data is collected through disparate Google Forms, stored in unstructured spreadsheets, and student eligibility is verified through manual VLOOKUP formulas. Resumes are emailed or collected physically, leading to document loss.
> 
> In contrast, our proposed system provides a centralized relational database managed via Prisma ORM. Eligibility is evaluated dynamically in milliseconds using weighted criteria. Alumni recruiters are authenticated automatically via neural OCR degree parsing. Students apply with a single click after answering customizable screening questionnaires. Furthermore, repetitive administrative inquiries are handled autonomously by our RAG AI assistant."

---

### Slide 6: System Users and Role Hierarchy
**Speaker Notes:**
> "Our architecture enforces a strict four-tier role hierarchy:
> - **Students:** Can manage their academic profiles, upload PDF resumes, receive automated skill extractions, view their eligibility match scores, submit screening answers, and track their application progress through six distinct stages.
> - **Alumni / Recruiters:** After undergoing document verification, they can publish job openings, define eligibility thresholds, review applicant resumes, and transition candidate statuses from Shortlisted to Selected.
> - **Placement Officers (Admins):** Moderate all incoming job postings, manage the student directory, review borderline alumni verification cases, and export placement reports.
> - **Super Administrators:** Maintain institutional control, create administrative accounts, and inspect security audit logs.
> Permissions are enforced on both the client side via React PrivateRoute and the server side via Express authorization middleware."

---

### Slide 7: Functional Requirements & Core Modules
**Speaker Notes:**
> "From an engineering standpoint, the portal is structured into five cohesive modules:
> - The **Authentication Module** manages stateless JWT tokens in HttpOnly cookies, bcrypt hashing, and password management.
> - The **Student & Resume Module** provides PDF text parsing, regex-based skill extraction, and coding profile links.
> - The **Job Lifecycle Module** supports draft job postings, admin moderation workflows, screening questions, and an automatic job expiry scheduler.
> - The **Eligibility & Matching Engine** calculates multi-factor alignment across skills, CGPA, branch, and backlogs.
> - Finally, the **Verification & Moderation Desk** provides administrative oversight over alumni credentials and placement analytics."

---

### Slide 8: End-to-End Application Workflow
**Speaker Notes:**
> "Here we trace the end-to-end lifecycle of a campus recruitment drive:
> 1. An alumni recruiter creates a job posting specifying package details, eligible branches, and minimum CGPA. The job enters the database with a status of `PENDING`.
> 2. The placement officer inspects the posting in the moderation queue and approves it, changing its status to `APPROVED`.
> 3. When an eligible student views the job, our matching engine checks their profile against the criteria and displays a match score.
> 4. If the job requires screening questions, the student completes them and submits their application, creating an `Application` record with status `APPLIED`.
> 5. The recruiter reviews the applicants, inspects their screening responses, downloads their resumes, and updates their status to `SHORTLISTED` or `SELECTED`.
> 6. When the application deadline passes, a background scheduler automatically updates the job status to `EXPIRED`."

---

### Slide 9: System Architecture
**Speaker Notes:**
> "This slide illustrates our system architecture:
> At the top, the client layer is built with React 19 and Vite 6, using Tailwind CSS for our institutional theme.
> The client communicates over HTTPS with our Node.js and Express backend API.
> In the data layer, PostgreSQL stores relational data and is interfaced through Prisma ORM. Crucially, we enabled the `pgvector` extension in PostgreSQL to support 768-dimensional vector similarity operations.
> We also integrate external and on-premise micro-services: Cloudinary for cloud media assets, Tesseract.js with Sharp for on-premise OCR, and Google GenAI for Gemini 2.5 Flash and embedding generation."

---

### Slide 10: Verified Technology Stack
**Speaker Notes:**
> "Every technology in this stack has been verified directly from our source code:
> - **Frontend:** React 19.0.0, Vite 6.2.0, React Router 7.13.1, and Tailwind CSS 4.1.14.
> - **Backend:** Node.js v18+, Express 4.18.3, Prisma ORM 5.10.0, and Zod for schema validation.
> - **Database:** PostgreSQL with pgvector extension.
> - **OCR & Document Processing:** Tesseract.js 7.0, Sharp 0.35, pdf-parse 1.1, and string-similarity 4.0.
> - **AI Integration:** `@google/genai` 2.26 connecting to Gemini 2.5 Flash and `gemini-embedding-2`.
> - **Testing:** Jest 29.7 with 36 test suites."

---

### Slide 11: Database Design & Entity Relationships
**Speaker Notes:**
> "Our relational schema consists of 13 Prisma models designed with strict referential integrity.
> The `User` model acts as the root authentication entity, linking via one-to-one relations to `Student`, `Alumni`, or `AdminProfile`.
> The `Job` model links to `Application` and `ApplicationScreeningAnswer`.
> To support our AI capabilities, we created `KnowledgeDocument` and `KnowledgeChunk`. In `KnowledgeChunk`, we store 768-dimensional vector embeddings using Prisma's unsupported vector type mapped to PostgreSQL's native vector column.
> For security, the `OcrAuditLog` table stores SHA-256 hashes of all uploaded documents along with confidence scores, preventing fraudulent re-registrations."

---

### Slide 12: AI Placement Assistant (Gemini & RAG)
**Speaker Notes:**
> "One of our most technically advanced features is the AI Placement Assistant.
> In campus recruitment, generic AI models often hallucinate company policies or criteria. To prevent this, we implemented a grounded Retrieval-Augmented Generation (RAG) architecture:
> 1. When jobs are approved, they are chunked and embedded using Google's `gemini-embedding-2` model into 768-dimensional vectors.
> 2. When a student asks a question—such as 'What jobs am I eligible for?'—we embed the query and perform a cosine distance search using pgvector (`<=>`).
> 3. In parallel, our backend retrieves the student's actual CGPA, department, and application history from PostgreSQL.
> 4. We inject both the retrieved job chunks and the student profile into a grounded system prompt sent to Gemini 2.5 Flash.
> 5. The model returns a factual, grounded response along with direct source citations."

---

### Slide 13: OCR-Based Document Verification Engine
**Speaker Notes:**
> "To guarantee that only legitimate alumni post jobs, we built an automated OCR document verification engine:
> 1. When an alumnus registers and uploads their degree certificate, we first compute its SHA-256 hash. If this exact document was previously verified, the system rejects it immediately.
> 2. We preprocess the image using Sharp to enhance contrast and readability.
> 3. Tesseract.js extracts the raw text.
> 4. Our verification service runs three matching algorithms: it checks for VVIT institutional keywords, normalizes and extracts the alphanumeric roll number, and uses Levenshtein and Dice coefficient algorithms to compare the full name.
> 5. If all three match with high confidence, the account is verified automatically. If discrepancies exist, it is rejected. If the image is unreadable, it is flagged for manual review."

---

### Slide 14: Security, RBAC & Data Protection
**Speaker Notes:**
> "Security was designed into the portal from day one using a defense-in-depth approach:
> - **Authentication Security:** JWT tokens are transmitted via HttpOnly, SameSite cookies. This prevents JavaScript from reading tokens and eliminates XSS-based token theft.
> - **IDOR Protection:** Every endpoint verifies that the authenticated user owns the requested record. A student cannot view another student's resume or applications.
> - **Input Validation:** API request bodies are validated using Zod, and queries are parameterized through Prisma, preventing SQL injection.
> - **File Handling:** Uploads are restricted by MIME type, limited to 10MB, and file paths are sanitized to prevent directory traversal attacks."

---

### Slide 15: Testing, Validation, Limitations & Roadmap
**Speaker Notes:**
> "We verified our system through 36 comprehensive Jest test suites covering authentication, IDOR vulnerabilities, OCR matching matrices, and eligibility scoring.
> 
> We also maintain engineering honesty regarding current limitations:
> - OCR processing currently executes synchronously, taking 2 to 4 seconds for high-resolution certificates. In production, we plan to decouple this using Redis and BullMQ.
> - In our UI, the AI Assistant modal was verified and its layout import has been updated.
> - Our future roadmap includes WhatsApp notification webhooks, automated semantic resume scoring, and live contest rating integration with LeetCode and HackerRank."

---

### Slide 16: Conclusion & Live Demonstration
**Speaker Notes:**
> "To conclude, the VVITU Placement Portal delivers an end-to-end, secure, and intelligent platform for university placements. We have automated eligibility checking, introduced tamper-proof OCR verification for recruiters, and integrated a state-of-the-art grounded AI placement assistant.
> 
> The application is fully containerized with Docker and ready for institutional deployment.
> We would like to express our gratitude to our project guide, our department head, and the review committee for their continuous support.
> We are now ready to demonstrate the live portal and answer your questions. Thank you!"
