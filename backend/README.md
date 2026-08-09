# VVIT Placement Portal — Node.js + Express.js Server (`server/`)

This directory contains the production-ready Node.js + Express.js backend for the VVIT Placement Management System, created as a high-performance Express alternative to the Spring Boot reference implementation.

## Architecture

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL (via Prisma ORM & mysql2)
- **Authentication**: JWT (JSON Web Tokens via HTTP-only Cookies and Bearer Header)
- **Password Hashing**: BCrypt (`bcryptjs`)
- **File Storage**: Multer (Local disk storage under `./uploads`)

---

## Directory Structure

```text
server/
├── prisma/
│   └── schema.prisma    # Database models & MySQL schema mapping
├── src/
│   ├── config/          # Environment & Database configuration
│   ├── controllers/     # Express route handlers
│   ├── middleware/      # JWT authentication, role authorization, file upload, error handling
│   ├── routes/          # API route definitions (/api/auth, /api/student, /api/alumni, /api/admin, etc.)
│   ├── seeders/         # Database seeder scripts (default Admin & Alumni accounts)
│   ├── services/        # Business logic services
│   ├── utils/           # JWT, BCrypt, and validation utility functions
│   └── app.js           # Express app configuration & middleware pipeline
├── tests/               # API Integration & Unit tests
├── uploads/             # Media upload storage (resumes, profile photos, documents)
├── .env.example         # Environment template placeholders
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies & scripts
└── server.js            # Entry point listener (Port 8082)
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Database Setup & Seeding
```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start listening on `http://localhost:8082`.

---

## API Summary

- **Public**: `GET /api/health`, `GET /api/departments`
- **Auth**: `POST /api/auth/login`, `POST /api/auth/register/student`, `POST /api/auth/register/alumni`, `POST/PUT /api/auth/change-password`, `POST /api/auth/logout`
- **Student**: `GET/PUT /api/student/profile`, `POST/DELETE /api/student/skills`, `POST/PUT/DELETE /api/student/projects`
- **Alumni**: `GET/PUT /api/alumni/profile`, `GET/POST /api/alumni/jobs`, `GET /api/alumni/jobs/:jobId/applications`, `PUT /api/alumni/applications/:id/status`
- **Admin**: `GET /api/admin/dashboard`, `GET /api/admin/profile`, `GET /api/admin/students`, `GET /api/admin/alumni`, `PUT /api/admin/alumni/:id/verify`, `GET /api/admin/jobs`, `PUT /api/admin/jobs/:id/status`, `POST/PUT /api/admin/change-password`
- **Jobs**: `GET /api/jobs/approved`, `GET /api/jobs/:id`
- **Applications**: `POST /api/applications`, `GET /api/applications/student`
- **Resumes**: `POST /api/resumes/upload`, `GET /api/resumes/my-resumes`

---

## Running Tests

```bash
npm test
```
