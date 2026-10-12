# VVITU Placement Portal: Architecture & Workflow Diagrams

This document contains **verified, production-accurate Mermaid diagrams** representing the actual architecture, workflows, and database entities of the VVITU Placement Portal.

---

## 1. Overall System Architecture

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        UI["React 19 SPA (Vite 6)"]
        Tailwind["Tailwind CSS 4.1 Theme (#F47C20 / #0A4D8C)"]
        Router["React Router 7.13 (PrivateRoute RBAC)"]
        AIAssistantWidget["AI Assistant Modal Widget"]
    end

    subgraph ReverseProxy ["Reverse Proxy / Gateway"]
        Nginx["Nginx Reverse Proxy / Cloudflare Pages"]
    end

    subgraph ApplicationLayer ["Application Tier (Backend)"]
        Express["Express.js 4.18 REST API (Node.js v18+)"]
        AuthMiddleware["JWT HttpOnly Cookie Auth Middleware"]
        RoleGuard["RBAC Authorization Guard (STUDENT / ALUMNI / ADMIN / SUPER_ADMIN)"]
        ZodValidator["Zod Input Validation Middleware"]
        
        subgraph CoreServices ["Business Services"]
            StudentSvc["Student & Resume Service"]
            JobSvc["Job & Screening Service"]
            MatchingSvc["6-Factor Matching Engine"]
            ExpiryJob["Job Expiry Background Scheduler"]
        end
        
        subgraph DocumentPipeline ["Document Verification Engine"]
            OcrSvc["Tesseract.js OCR Service"]
            SharpPre["Sharp Image Preprocessor"]
            DocVerify["Fuzzy String Matcher & Decision Matrix"]
        end
        
        subgraph AIPipeline ["AI & RAG Subsystem"]
            GeminiClient["Google GenAI SDK (Gemini 2.5 Flash)"]
            RagEngine["RAG Retrieval & Grounding Service"]
        end
    end

    subgraph DataLayer ["Data & Storage Tier"]
        Prisma["Prisma ORM 5.10"]
        Postgres[("PostgreSQL 14+ Database")]
        PgVector[("pgvector Extension (768-dim Vector Space)")]
        Cloudinary[("Cloudinary Media Storage / Local Disk Fallback")]
    end

    %% Connections
    UI --> Router
    Router --> Nginx
    Nginx --> Express
    Express --> AuthMiddleware
    AuthMiddleware --> RoleGuard
    RoleGuard --> ZodValidator
    ZodValidator --> CoreServices
    CoreServices --> Prisma
    
    %% Document Pipeline Flow
    Express --> DocumentPipeline
    DocumentPipeline --> SharpPre
    SharpPre --> OcrSvc
    OcrSvc --> DocVerify
    DocVerify --> Prisma

    %% AI Pipeline Flow
    Express --> AIPipeline
    RagEngine --> GeminiClient
    RagEngine --> PgVector
    
    %% Storage
    Prisma --> Postgres
    Postgres -.-> PgVector
    Express -.-> Cloudinary
```

---

## 2. Role-Based Application Workflow

```mermaid
flowchart TD
    Start([User Enters Portal]) --> AuthCheck{Authenticated?}
    
    AuthCheck -->|No| LoginRegister[Login / Register Screen]
    LoginRegister -->|Student Registration| RegStudent[Register with VVIT Roll Number]
    LoginRegister -->|Alumni Registration| RegAlumni[Upload Degree Certificate]
    
    RegAlumni --> OCR[OCR Pipeline: SHA-256 Hash + Tesseract.js OCR]
    OCR --> OCRDecision{Confidence > 85%?}
    OCRDecision -->|Yes| AutoVerified[Status: VERIFIED]
    OCRDecision -->|No / Borderline| PendingReview[Status: PENDING_MANUAL_REVIEW]
    OCRDecision -->|Mismatch| Rejected[Status: REJECTED]
    
    AuthCheck -->|Yes| RoleCheck{User Role}
    
    %% Student Flow
    RoleCheck -->|STUDENT| StudentHome[Student Dashboard]
    StudentHome --> Profile[Complete Profile & Upload Resume]
    Profile --> ResumeParse[PDF Parse & Auto-Extract Skills]
    StudentHome --> BrowseJobs[Browse Approved Jobs]
    BrowseJobs --> MatchEngine[6-Factor Matching Engine]
    MatchEngine --> CheckEligible{Is Eligible?}
    CheckEligible -->|Yes| ScreenModal[Answer Pre-Screening Questions]
    CheckEligible -->|No| ViewReasons[View Failed Eligibility Criteria]
    ScreenModal --> SubmitApp[Submit Application: Status APPLIED]
    SubmitApp --> TrackApp[Track Hiring Status in Dashboard]
    
    %% Alumni Flow
    RoleCheck -->|ALUMNI| AlumniHome[Alumni Dashboard]
    AlumniHome --> PostJob[Create Job Post + Eligibility Rules + Screening Qs]
    PostJob --> JobPending[Job Created: Status PENDING]
    AlumniHome --> ManageApps[Review Candidate Resumes & Screening Answers]
    ManageApps --> UpdateStatus[Update Candidate Stage: SHORTLISTED / SELECTED]
    
    %% Admin Flow
    RoleCheck -->|ADMIN| AdminHome[Admin Placement Desk]
    AdminHome --> ReviewJobs[Job Moderation Queue]
    ReviewJobs -->|Approve| ApproveJob[Job Status: APPROVED & Indexed into RAG]
    ReviewJobs -->|Reject| RejectJob[Job Status: REJECTED]
    AdminHome --> VerifyAlumni[Alumni Verification Desk]
    VerifyAlumni --> ReviewOCR[Inspect OCR Audit Log & Approve/Reject]
    AdminHome --> StudentDirectory[Student Management & Excel/CSV Export]
    
    %% Super Admin Flow
    RoleCheck -->|SUPER_ADMIN| SuperHome[Super Admin Console]
    SuperHome --> ManageAdmins[Provision & Deactivate Admin Accounts]
    SuperHome --> AuditLogs[Inspect Security & Document Audit Logs]
```

---

## 3. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| Student : "has"
    User ||--o| Alumni : "has"
    User ||--o| AdminProfile : "has"
    User ||--o{ Job : "creates"
    User ||--o{ AiConversation : "initiates"

    Student ||--o| Resume : "uploads"
    Student ||--o{ StudentSkill : "owns"
    Student ||--o{ StudentProject : "maintains"
    Student ||--o{ Application : "submits"

    Alumni ||--o{ Job : "posts"

    Job ||--o{ Application : "receives"
    Application ||--o{ ApplicationScreeningAnswer : "contains"

    KnowledgeDocument ||--o{ KnowledgeChunk : "split into"
    AiConversation ||--o{ AiMessage : "contains"

    User {
        BigInt id PK
        String email UK
        String password
        Role role "STUDENT | ALUMNI | ADMIN | SUPER_ADMIN"
        AccountStatus accountStatus
        DateTime createdAt
        DateTime updatedAt
    }

    Student {
        BigInt id PK
        BigInt userId FK
        String rollNumber UK
        String department
        Float cgpa
        Int semester
        Int backlogs
        VerificationStatus verificationStatus
    }

    Alumni {
        BigInt id PK
        BigInt userId FK
        String company
        String designation
        String rollNumber UK
        Boolean ocrVerified
        Float ocrConfidenceScore
        Boolean manualReviewRequired
        VerificationStatus verificationStatus
    }

    AdminProfile {
        BigInt id PK
        BigInt userId FK
        String employeeId UK
        String department
        String designation
    }

    Job {
        BigInt id PK
        String title
        String companyName
        Float requiredCgpa
        Int maxBacklogs
        String eligibleDepartments
        JobStatus status "PENDING | APPROVED | REJECTED | EXPIRED"
        Boolean enableScreening
        DateTime applicationDeadline
    }

    Application {
        BigInt id PK
        BigInt jobId FK
        BigInt studentId FK
        ApplicationStatus status "APPLIED | SHORTLISTED | SELECTED | REJECTED"
        DateTime appliedAt
    }

    ApplicationScreeningAnswer {
        BigInt id PK
        BigInt applicationId FK
        String question
        String answer
    }

    KnowledgeDocument {
        BigInt id PK
        String sourceId
        String type "JOB | FAQ"
        String title
        String content
    }

    KnowledgeChunk {
        BigInt id PK
        BigInt documentId FK
        String content
        vector embedding "768 dimensions"
    }

    AiConversation {
        BigInt id PK
        BigInt userId FK
    }

    AiMessage {
        BigInt id PK
        BigInt conversationId FK
        String role "user | model"
        String content
        Json sources
    }

    OcrAuditLog {
        BigInt id PK
        String fileName
        String documentHash "SHA-256"
        String formName
        String formRollNumber
        String extractedName
        String extractedIdentifier
        Float confidenceScore
        Boolean isVerified
        Boolean manualReviewRequired
    }
```

---

## 4. AI Placement Assistant RAG Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant UI as AIAssistant Modal (React)
    participant API as /api/ai/chat (Express)
    participant RAG as RAG Service
    participant Gemini as Google GenAI SDK (Gemini 2.5 Flash)
    participant DB as PostgreSQL + pgvector

    %% Job Indexing Phase (Prior to Chat)
    Note over API,DB: Background / Admin Job Ingestion Phase
    API->>RAG: syncKnowledgeBase() / indexJob(job)
    RAG->>RAG: Chunk Job Requirements (Title, Skills, CGPA, Branch)
    RAG->>Gemini: generateEmbedding(textChunk) [gemini-embedding-2]
    Gemini-->>RAG: 768-dimensional float vector
    RAG->>DB: INSERT into knowledge_chunks (embedding::vector)

    %% Query Phase
    Note over Student,DB: Real-time Student Chat Phase
    Student->>UI: Types: "What jobs am I eligible for in CSE?"
    UI->>API: POST /api/ai/chat { message }
    API->>RAG: searchSimilar(message, topK=5)
    RAG->>Gemini: generateEmbedding(message)
    Gemini-->>RAG: Query vector (768-dim)
    RAG->>DB: Cosine Similarity Query: ORDER BY embedding <=> query_vector LIMIT 5
    DB-->>RAG: Top-5 Matching Job Chunks

    API->>RAG: fetchStructuredContext(user, message)
    RAG->>DB: Query Student Profile (CGPA: 8.2, Dept: CSE, Backlogs: 0, Applied Jobs)
    DB-->>RAG: Structured Academic Context

    API->>Gemini: generateGroundedResponse(System Prompt, Chunks, Question, Profile Context)
    Note over Gemini: Temperature 0.2, Strict Zero-Hallucination Guardrails
    Gemini-->>API: Grounded Answer + Source Metadata
    API->>DB: Save Conversation & Message to AiMessage table
    API-->>UI: { answer, sources: [{ title, type, id }] }
    UI-->>Student: Renders Answer with Interactive Source Citation Badges
```

---

## 5. OCR Degree Document Verification Pipeline

```mermaid
flowchart TD
    Upload([Alumni Uploads Degree Certificate PDF/IMG]) --> HashGen[Compute SHA-256 Hash of File Buffer]
    
    HashGen --> CheckDuplicate{Hash Exists in OcrAuditLog with isVerified=true?}
    CheckDuplicate -->|Yes| DupFail[Decision: REJECTED\nReason: DUPLICATE_DOCUMENT]
    
    CheckDuplicate -->|No| Preprocess[Sharp Image Preprocessing\nNormalize DPI, Contrast, Grayscale]
    Preprocess --> Tesseract[Tesseract.js OCR Execution\nPSM Mode 3, English Model]
    Tesseract --> RawText[Extracted Raw Text Buffer]
    
    RawText --> TextCheck{Text Meaningful?\n>50 chars & >10 words}
    TextCheck -->|No| LowQual[Decision: PENDING_MANUAL_REVIEW\nReason: DOCUMENT_UNREADABLE]
    
    TextCheck -->|Yes| Matchers[Run 3 Parallel Matching Engines]
    
    subgraph MatchingEngines ["Tri-Factor Matching Logic"]
        CollegeMatch["College Affiliation Match:\nToken search for VVIT / VVITU / Vasireddy Venkatadri"]
        RollMatch["Roll Number Match:\nAlphanumeric normalization & pattern extraction"]
        NameMatch["Full Name Match:\nDice Coefficient & Levenshtein string similarity"]
    end
    
    Matchers --> CollegeMatch
    Matchers --> RollMatch
    Matchers --> NameMatch
    
    CollegeMatch --> CentralEngine[Central Decision Engine]
    RollMatch --> CentralEngine
    NameMatch --> CentralEngine
    
    CentralEngine --> DecisionMatrix{Evaluate Match Results}
    
    DecisionMatrix -->|Name + Roll + College All MATCH| Verified[Decision: VERIFIED\nAccount Activated Immediately]
    DecisionMatrix -->|Explicit Field MISMATCH| RejectField[Decision: REJECTED\nReason: Mismatch specific message displayed]
    DecisionMatrix -->|Partial Match / Fuzzy Confidence <85%| ManualReview[Decision: PENDING_MANUAL_REVIEW\nEscalated to Admin Verification Desk]
    
    Verified --> SaveAudit[Save Audit Entry in ocr_audit_logs with IP & Hash]
    RejectField --> SaveAudit
    ManualReview --> SaveAudit
    DupFail --> SaveAudit
    LowQual --> SaveAudit
```

---

## 6. Production Deployment Architecture

```mermaid
graph LR
    subgraph PublicInternet ["Public Internet"]
        Users["Students / Recruiters / Admins"]
    end

    subgraph CDN ["Edge Layer (Cloudflare Pages)"]
        CF["Cloudflare Edge Network"]
        StaticAssets["Static Frontend Bundle (React 19 / Vite dist)"]
    end

    subgraph CloudHost ["Application Hosting (Cloud / Docker VPS)"]
        NginxServer["Nginx Reverse Proxy (Port 80/443, SSL Termination)"]
        
        subgraph BackendContainer ["Backend Docker Container (Node.js)"]
            NodeServer["Express API Server (Port 8082)"]
            TesseractWorker["Tesseract.js OCR Worker"]
            Scheduler["Job Expiry Scheduler"]
        end
        
        subgraph DBContainer ["Database Container"]
            PostgreSQLDB[("PostgreSQL 14 Engine")]
            PgVectorExt[("pgvector Extension")]
        end
    end

    subgraph ThirdPartyAPIs ["External Cloud Services"]
        GoogleAI["Google Gemini 2.5 API (GenAI Endpoint)"]
        CloudinaryStorage["Cloudinary Media Storage (Resumes & Logos)"]
    end

    %% Network Connections
    Users -->|HTTPS| CF
    CF --> StaticAssets
    Users -->|API Requests /api/*| NginxServer
    NginxServer --> NodeServer
    NodeServer --> PostgreSQLDB
    PostgreSQLDB -.-> PgVectorExt
    NodeServer -->|Embeddings & Chat| GoogleAI
    NodeServer -->|Media Uploads| CloudinaryStorage
```
