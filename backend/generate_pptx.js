
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'VVITU Placement Cell Project Team';
pptx.company = 'Vasireddy Venkatadri International Technological University';
pptx.title = 'VVITU Placement Portal: Major Project Presentation';

// Official & verified palette
const NAVY = '0A4D8C';
const ORANGE = 'F47C20';
const DARK_SLATE = '1E293B';
const LIGHT_BG = 'F8FAFC';
const WHITE = 'FFFFFF';
const MUTED = '64748B';
const CARD_BG = 'FFFFFF';
const BORDER_COLOR = 'E2E8F0';

function addHeader(slide, title, category) {
  // Category Pill
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 0.4, w: 2.2, h: 0.32,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 1 }
  });
  slide.addText(category.toUpperCase(), {
    x: 0.8, y: 0.4, w: 2.2, h: 0.32,
    fontSize: 9, bold: true, color: NAVY, align: 'center', valign: 'middle'
  });

  // Main Slide Title
  slide.addText(title, {
    x: 0.8, y: 0.78, w: 10.0, h: 0.6,
    fontSize: 22, bold: true, color: DARK_SLATE
  });

  // Top accent line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.4, w: 11.7, h: 0.04,
    fill: { color: ORANGE },
    line: { type: 'none' }
  });
}

function addFooter(slide, currentSlide, totalSlides = 16) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 6.9, w: 11.7, h: 0.02,
    fill: { color: BORDER_COLOR },
    line: { type: 'none' }
  });
  slide.addText('Vasireddy Venkatadri International Technological University (VVITU) • B.Tech Major Project Review', {
    x: 0.8, y: 6.95, w: 9.5, h: 0.4,
    fontSize: 9, color: MUTED
  });
  slide.addText(`${currentSlide} / ${totalSlides}`, {
    x: 10.5, y: 6.95, w: 2.0, h: 0.4,
    fontSize: 9, bold: true, color: NAVY, align: 'right'
  });
}

// -------------------------------------------------------------
// SLIDE 1: Title Slide
// -------------------------------------------------------------
const slide1 = pptx.addSlide();
slide1.background = { color: NAVY };

// Decorative shapes
slide1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 0.3, h: 7.5,
  fill: { color: ORANGE }, line: { type: 'none' }
});

slide1.addText('VASIREDDY VENKATADRI INTERNATIONAL TECHNOLOGICAL UNIVERSITY', {
  x: 1.0, y: 1.2, w: 11.0, h: 0.4,
  fontSize: 13, bold: true, color: '93C5FD', tracking: 1.5
});

slide1.addText('VVITU Placement Portal', {
  x: 1.0, y: 1.7, w: 11.0, h: 1.1,
  fontSize: 40, bold: true, color: WHITE
});

slide1.addText('Enterprise Campus Placement & Recruitment Management System', {
  x: 1.0, y: 2.8, w: 11.0, h: 0.6,
  fontSize: 18, color: 'FDBA74', bold: true
});

slide1.addShape(pptx.ShapeType.rect, {
  x: 1.0, y: 3.5, w: 11.3, h: 0.05,
  fill: { color: ORANGE }, line: { type: 'none' }
});

slide1.addText('A unified, role-governed platform automating student eligibility matching, neural OCR degree verification, screening questionnaires, and grounded AI-powered placement assistance.', {
  x: 1.0, y: 3.7, w: 10.5, h: 0.8,
  fontSize: 13, color: 'E2E8F0', lineSpacing: 20
});

// Meta details card
slide1.addShape(pptx.ShapeType.rect, {
  x: 1.0, y: 4.8, w: 11.3, h: 1.8,
  fill: { color: '0F3B66' },
  line: { color: '1D4ED8', width: 1 }
});

slide1.addText('PROJECT SPECIFICATIONS', {
  x: 1.3, y: 5.0, w: 5.0, h: 0.3,
  fontSize: 10, bold: true, color: ORANGE
});
slide1.addText([
  { text: 'Academic Level: ', options: { bold: true, color: WHITE } },
  { text: 'B.Tech Final Year Major Project (2025–2026)\n', options: { color: 'CBD5E1' } },
  { text: 'Department: ', options: { bold: true, color: WHITE } },
  { text: 'Computer Science and Engineering / IT\n', options: { color: 'CBD5E1' } },
  { text: 'Key Domains: ', options: { bold: true, color: WHITE } },
  { text: 'Full-Stack Web Engineering, Neural OCR, RAG Vector Search', options: { color: 'CBD5E1' } }
], {
  x: 1.3, y: 5.3, w: 10.5, h: 1.2,
  fontSize: 11, lineSpacing: 18
});

// -------------------------------------------------------------
// SLIDE 2: Project Abstract
// -------------------------------------------------------------
const slide2 = pptx.addSlide();
slide2.background = { color: LIGHT_BG };
addHeader(slide2, 'Project Abstract & Scope', 'Executive Overview');
addFooter(slide2, 2);

const abstractBoxes = [
  { title: 'The Problem', desc: 'Manual spreadsheets, Google Forms, and fragmented communication channels create severe delays, eligibility errors, and document loss during high-volume campus recruitment.', color: 'DC2626' },
  { title: 'Proposed Solution', desc: 'A centralized, 4-tier role-governed web application integrating automated eligibility verification, OCR document authentication, and an AI placement assistant.', color: NAVY },
  { title: 'Key Technologies', desc: 'Engineered with React 19, Node.js & Express, PostgreSQL with pgvector, Prisma ORM, Tesseract.js neural OCR, and Google Gemini 2.5 Flash SDK.', color: ORANGE },
  { title: 'Demonstrated Benefits', desc: 'Instantaneous 6-factor candidate filtering, autonomous alumni credential verification, zero-hallucination student Q&A, and complete audit compliance.', color: '059669' }
];

abstractBoxes.forEach((box, i) => {
  const x = 0.8 + (i % 2) * 6.0;
  const y = 1.65 + Math.floor(i / 2) * 2.5;

  slide2.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.7, h: 2.25,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide2.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.7, h: 0.1,
    fill: { color: box.color },
    line: { type: 'none' }
  });
  slide2.addText(box.title, {
    x: x + 0.3, y: y + 0.25, w: 5.1, h: 0.4,
    fontSize: 14, bold: true, color: DARK_SLATE
  });
  slide2.addText(box.desc, {
    x: x + 0.3, y: y + 0.7, w: 5.1, h: 1.35,
    fontSize: 11, color: MUTED, lineSpacing: 18
  });
});

// -------------------------------------------------------------
// SLIDE 3: Problem Statement
// -------------------------------------------------------------
const slide3 = pptx.addSlide();
slide3.background = { color: LIGHT_BG };
addHeader(slide3, 'Problem Statement & Challenges', 'Operational Need');
addFooter(slide3, 3);

const problems = [
  { num: '01', title: 'Manual & Error-Prone Eligibility Checks', text: 'Cross-referencing hundreds of applicants against company criteria (CGPA cutoff, backlog limits, eligible branches) manually leads to human error and delayed shortlists.' },
  { num: '02', title: 'Unverified Recruiter Credentials', text: 'Traditional open forms fail to authenticate alumni or recruiters, posing severe security risks regarding fraudulent job postings and student data exploitation.' },
  { num: '03', title: 'Application Tracking Disconnection', text: 'Lack of unified tracking leaves students unaware of their application lifecycle stages (Applied, Shortlisted, Interview Scheduled, Offer Released, Rejected).' },
  { num: '04', title: 'Document Misplacement & Data Loss', text: 'Physical resumes and emails are easily misplaced. System restarts often break unmanaged local storage paths, leading to lost student submissions.' },
  { num: '05', title: 'Repetitive Placement Cell Overhead', text: 'Placement officers expend hundreds of hours addressing repetitive eligibility queries and compiling institutional placement reports manually.' }
];

problems.forEach((p, i) => {
  const y = 1.6 + i * 1.0;
  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.85,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 0.8, h: 0.85,
    fill: { color: 'EFF6FF' },
    line: { type: 'none' }
  });
  slide3.addText(p.num, {
    x: 0.8, y, w: 0.8, h: 0.85,
    fontSize: 13, bold: true, color: NAVY, align: 'center', valign: 'middle'
  });
  slide3.addText(p.title, {
    x: 1.8, y: y + 0.1, w: 4.5, h: 0.3,
    fontSize: 12, bold: true, color: DARK_SLATE
  });
  slide3.addText(p.text, {
    x: 1.8, y: y + 0.4, w: 10.4, h: 0.4,
    fontSize: 10, color: MUTED
  });
});

// -------------------------------------------------------------
// SLIDE 4: Project Objectives
// -------------------------------------------------------------
const slide4 = pptx.addSlide();
slide4.background = { color: LIGHT_BG };
addHeader(slide4, 'Core Objectives & Deliverables', 'System Goals');
addFooter(slide4, 4);

const objectives = [
  { icon: '🔒', title: 'Multi-Role Access Control', text: 'Implement strict RBAC across 4 user levels (Student, Alumni, Admin, Super Admin) with HttpOnly JWT authentication and IDOR protection.' },
  { icon: '⚡', title: 'Automated 6-Factor Matching', text: 'Develop a dynamic algorithm evaluating Skills (50%), Education (15%), Branch (10%), Experience (10%), CGPA/Backlogs (10%), and Certifications (5%).' },
  { icon: '📄', title: 'Neural OCR Verification', text: 'Deploy an on-premise Tesseract.js & Sharp engine to autonomously verify alumni degree certificates via roll number, name, and institutional keywords.' },
  { icon: '🤖', title: 'Grounded RAG AI Assistant', text: 'Integrate Google Gemini 2.5 Flash and PostgreSQL pgvector (768-dim embeddings) for zero-hallucination institutional placement guidance.' },
  { icon: '📊', title: 'Bulk Administration & Analytics', text: 'Provide placement officers with one-click Excel import/export, applicant screening question configuration, and automatic drive expiry.' }
];

objectives.forEach((obj, i) => {
  const y = 1.6 + i * 1.0;
  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.88,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide4.addText(obj.icon, {
    x: 1.0, y: y + 0.15, w: 0.6, h: 0.5,
    fontSize: 18, align: 'center'
  });
  slide4.addText(obj.title, {
    x: 1.8, y: y + 0.12, w: 4.5, h: 0.3,
    fontSize: 13, bold: true, color: NAVY
  });
  slide4.addText(obj.text, {
    x: 1.8, y: y + 0.42, w: 10.4, h: 0.4,
    fontSize: 10.5, color: MUTED
  });
});

// -------------------------------------------------------------
// SLIDE 5: Existing System vs Proposed Solution
// -------------------------------------------------------------
const slide5 = pptx.addSlide();
slide5.background = { color: LIGHT_BG };
addHeader(slide5, 'Existing vs. Proposed Solution', 'Comparative Analysis');
addFooter(slide5, 5);

const rawCompRows = [
  ['System Dimension', 'Existing Traditional Workflow', 'Proposed VVITU Placement Portal'],
  ['Data Architecture', 'Fragmented Google Sheets & WhatsApp links', 'Centralized PostgreSQL with Prisma ORM'],
  ['Eligibility Verification', 'Manual spreadsheet filtering; prone to errors', 'Instant 6-factor dynamic matching calculation'],
  ['Recruiter Onboarding', 'Unverified email communications', 'Autonomous OCR certificate verification & approval desk'],
  ['Student Applications', 'Unstructured Google Forms; resume email clutter', 'One-click apply with custom screening questionnaires'],
  ['Query Resolution', 'In-person visits & repetitive faculty calls', '24/7 Grounded AI Assistant powered by RAG & Gemini'],
  ['Data Reporting & Audit', 'Manual copy-pasting of placement lists', 'Automated Excel/CSV export & immutable audit logs']
];

const formattedCompRows = rawCompRows.map((row, rowIdx) => {
  return row.map((cellText, colIdx) => ({
    text: cellText,
    options: {
      fill: { color: rowIdx === 0 ? NAVY : (rowIdx % 2 === 0 ? 'F1F5F9' : WHITE) },
      color: rowIdx === 0 ? WHITE : DARK_SLATE,
      fontSize: rowIdx === 0 ? 11 : 9.5,
      bold: rowIdx === 0 || colIdx === 0,
      valign: 'middle'
    }
  }));
});

slide5.addTable(formattedCompRows, {
  x: 0.8, y: 1.6, w: 11.7, h: 5.0,
  colW: [2.5, 4.6, 4.6],
  border: { color: BORDER_COLOR, width: 1 }
});

// -------------------------------------------------------------
// SLIDE 6: System Users and Role Architecture
// -------------------------------------------------------------
const slide6 = pptx.addSlide();
slide6.background = { color: LIGHT_BG };
addHeader(slide6, 'System Users & Role Architecture', 'Role-Based Access');
addFooter(slide6, 6);

const roles = [
  { role: 'STUDENT', title: 'Candidate Portal', color: '2563EB', desc: '• Academic profile (CGPA, backlogs, branch)\n• PDF resume upload with automated skill parsing\n• Dynamic eligibility match score viewing\n• Screening questionnaire submission\n• Real-time application stage tracking' },
  { role: 'ALUMNI', title: 'Recruiter Desk', color: ORANGE, desc: '• Degree certificate upload with automated OCR\n• Job posting with CGPA/branch/backlog criteria\n• Custom pre-application screening questions\n• Applicant resume review & profile inspection\n• Candidate stage progression (Shortlist/Select)' },
  { role: 'ADMIN', title: 'Placement Officer', color: NAVY, desc: '• Centralized job moderation (Approve / Reject)\n• Alumni verification desk with OCR confidence audit\n• Student directory filtering by CGPA and branch\n• Bulk student import & export to Excel/CSV\n• Institutional placement performance metrics' },
  { role: 'SUPER_ADMIN', title: 'System Controller', color: '7C3AED', desc: '• Provisioning & lifecycle of administrator accounts\n• University-wide system settings configuration\n• Global security & document verification audit logs\n• Multi-role permission oversight' }
];

roles.forEach((r, i) => {
  const x = 0.8 + i * 3.0;
  slide6.addShape(pptx.ShapeType.rect, {
    x, y: 1.6, w: 2.7, h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide6.addShape(pptx.ShapeType.rect, {
    x, y: 1.6, w: 2.7, h: 0.1,
    fill: { color: r.color },
    line: { type: 'none' }
  });
  slide6.addText(r.role, {
    x: x + 0.2, y: 1.8, w: 2.3, h: 0.3,
    fontSize: 12, bold: true, color: r.color
  });
  slide6.addText(r.title, {
    x: x + 0.2, y: 2.1, w: 2.3, h: 0.3,
    fontSize: 10, bold: true, color: DARK_SLATE
  });
  slide6.addText(r.desc, {
    x: x + 0.2, y: 2.5, w: 2.3, h: 3.9,
    fontSize: 9.5, color: MUTED, lineSpacing: 16
  });
});

// -------------------------------------------------------------
// SLIDE 7: Functional Requirements & Core Modules
// -------------------------------------------------------------
const slide7 = pptx.addSlide();
slide7.background = { color: LIGHT_BG };
addHeader(slide7, 'Functional Requirements & Modules', 'Modular Design');
addFooter(slide7, 7);

const modules = [
  { name: 'Auth & Security Module', points: 'JWT HttpOnly cookies, bcrypt hashing, IDOR prevention, password reset workflow.' },
  { name: 'Student & Resume Module', points: 'Profile completeness tracker, PDF text parsing, automated regex skill extraction, portfolio links.' },
  { name: 'Job & Screening Module', points: 'Recruiter job post drafting, admin moderation queue, custom screening questions, automatic deadline expiry.' },
  { name: 'Eligibility & Matching Engine', points: 'Multi-factor weighted calculation (Skills, CGPA, Branch, Backlogs, Semester, Certifications).' },
  { name: 'Verification & OCR Desk', points: 'SHA-256 duplicate detection, Sharp preprocessing, Tesseract.js text extraction, fuzzy token matching.' },
  { name: 'AI Placement Assistant (RAG)', points: 'Automated job chunking, gemini-embedding-2 vectors, pgvector cosine search, Gemini 2.5 grounded generation.' }
];

modules.forEach((m, i) => {
  const x = 0.8 + (i % 2) * 6.0;
  const y = 1.6 + Math.floor(i / 2) * 1.7;

  slide7.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.7, h: 1.5,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide7.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.1, h: 1.5,
    fill: { color: i % 2 === 0 ? NAVY : ORANGE },
    line: { type: 'none' }
  });
  slide7.addText(m.name, {
    x: x + 0.3, y: y + 0.15, w: 5.1, h: 0.35,
    fontSize: 13, bold: true, color: DARK_SLATE
  });
  slide7.addText(m.points, {
    x: x + 0.3, y: y + 0.55, w: 5.1, h: 0.8,
    fontSize: 10.5, color: MUTED, lineSpacing: 16
  });
});

// -------------------------------------------------------------
// SLIDE 8: End-to-End Application Workflow
// -------------------------------------------------------------
const slide8 = pptx.addSlide();
slide8.background = { color: LIGHT_BG };
addHeader(slide8, 'End-to-End Recruitment Workflow', 'Process Trace');
addFooter(slide8, 8);

const steps = [
  { step: '1', title: 'Recruiter Posts Job', desc: 'Alumni posts drive with criteria (CGPA, backlogs, branch) and optional screening questions.' },
  { step: '2', title: 'Admin Moderation', desc: 'Placement officer verifies company legitimacy and approves posting. Job status transitions to APPROVED.' },
  { step: '3', title: 'Student Discovery', desc: 'Matching engine evaluates student profile and displays match percentage and eligibility badges.' },
  { step: '4', title: 'Screening & Apply', desc: 'Student answers screening questions (relocation, bond) and submits application with resume.' },
  { step: '5', title: 'Recruiter Review', desc: 'Recruiter inspects candidate responses, downloads resume, and moves status to SHORTLISTED.' },
  { step: '6', title: 'Hiring & Offer', desc: 'Recruiter releases final selection status (SELECTED). Audit logs record hiring completion.' }
];

steps.forEach((st, i) => {
  const x = 0.8 + (i % 3) * 4.0;
  const y = 1.6 + Math.floor(i / 3) * 2.5;

  slide8.addShape(pptx.ShapeType.rect, {
    x, y, w: 3.7, h: 2.2,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide8.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.25, y: y + 0.2, w: 0.5, h: 0.5,
    fill: { color: NAVY }, line: { type: 'none' }
  });
  slide8.addText(st.step, {
    x: x + 0.25, y: y + 0.2, w: 0.5, h: 0.5,
    fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle'
  });
  slide8.addText(st.title, {
    x: x + 0.9, y: y + 0.25, w: 2.6, h: 0.35,
    fontSize: 12, bold: true, color: DARK_SLATE
  });
  slide8.addText(st.desc, {
    x: x + 0.25, y: y + 0.85, w: 3.2, h: 1.2,
    fontSize: 10, color: MUTED, lineSpacing: 16
  });
});

// -------------------------------------------------------------
// SLIDE 9: System Architecture
// -------------------------------------------------------------
const slide9 = pptx.addSlide();
slide9.background = { color: LIGHT_BG };
addHeader(slide9, 'Layered System Architecture', 'Technical Blueprint');
addFooter(slide9, 9);

const tiers = [
  { tier: 'CLIENT TIER', comp: 'React 19 Single Page App • Vite 6 Bundler • Tailwind CSS 4.1 Theme • React Router 7.13 RBAC Guards' },
  { tier: 'GATEWAY & NETWORK', comp: 'Nginx Reverse Proxy / Cloudflare Pages • SSL/TLS Termination • CORS Policy Guard' },
  { tier: 'APPLICATION TIER', comp: 'Node.js & Express.js REST API • JWT Cookie Authentication • Zod Schema Validation • Job Expiry Scheduler' },
  { tier: 'DATA & STORAGE TIER', comp: 'PostgreSQL Relational DB • Prisma ORM 5.10 • pgvector Extension (768-dim Vector Space) • Cloudinary Media Storage' },
  { tier: 'INTELLIGENT SERVICES', comp: 'Neural OCR: Tesseract.js 7.0 + Sharp Preprocessor\nAI Subsystem: Google Gemini 2.5 Flash + gemini-embedding-2 + RAG Retrieval' }
];

tiers.forEach((t, i) => {
  const y = 1.6 + i * 1.0;
  slide9.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.88,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide9.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 2.5, h: 0.88,
    fill: { color: i % 2 === 0 ? NAVY : '1E3A8A' },
    line: { type: 'none' }
  });
  slide9.addText(t.tier, {
    x: 0.8, y, w: 2.5, h: 0.88,
    fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle'
  });
  slide9.addText(t.comp, {
    x: 3.5, y: y + 0.1, w: 8.8, h: 0.68,
    fontSize: 10, color: DARK_SLATE, valign: 'middle'
  });
});

// -------------------------------------------------------------
// SLIDE 10: Verified Technology Stack
// -------------------------------------------------------------
const slide10 = pptx.addSlide();
slide10.background = { color: LIGHT_BG };
addHeader(slide10, 'Verified Technology Stack', 'Engineering Foundation');
addFooter(slide10, 10);

const techGrid = [
  { area: 'Frontend SPA', tech: 'React 19.0.0', role: 'Component-driven user interface with hooks and suspense.' },
  { area: 'Build Tooling', tech: 'Vite 6.2.0', role: 'High-speed ESM bundling and Hot Module Replacement.' },
  { area: 'Design System', tech: 'Tailwind CSS 4.1.14', role: 'Institutional palette (#F47C20 Orange, #0A4D8C Navy).' },
  { area: 'Backend Engine', tech: 'Node.js & Express 4.18', role: 'Asynchronous event-driven RESTful API micro-services.' },
  { area: 'Data Access', tech: 'Prisma ORM 5.10.0', role: 'Type-safe schema modeling, migrations, and raw SQL queries.' },
  { area: 'Relational DB', tech: 'PostgreSQL 14+', role: 'ACID transactional data storage and relational constraints.' },
  { area: 'Vector Search', tech: 'pgvector 0.2.1', role: 'Cosine distance (<=>) search over 768-dim embeddings.' },
  { area: 'Generative AI', tech: '@google/genai 2.26.0', role: 'Gemini 2.5 Flash chat and gemini-embedding-2 RAG model.' },
  { area: 'Neural OCR', tech: 'Tesseract.js 7.0 & Sharp', role: 'On-premise image preprocessing and text extraction.' }
];

techGrid.forEach((tg, i) => {
  const x = 0.8 + (i % 3) * 4.0;
  const y = 1.6 + Math.floor(i / 3) * 1.7;

  slide10.addShape(pptx.ShapeType.rect, {
    x, y, w: 3.7, h: 1.5,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide10.addText(tg.area.toUpperCase(), {
    x: x + 0.2, y: y + 0.15, w: 3.3, h: 0.25,
    fontSize: 9, bold: true, color: ORANGE
  });
  slide10.addText(tg.tech, {
    x: x + 0.2, y: y + 0.4, w: 3.3, h: 0.35,
    fontSize: 12, bold: true, color: NAVY
  });
  slide10.addText(tg.role, {
    x: x + 0.2, y: y + 0.75, w: 3.3, h: 0.65,
    fontSize: 9.5, color: MUTED
  });
});

// -------------------------------------------------------------
// SLIDE 11: Database Design & Entity Relationships
// -------------------------------------------------------------
const slide11 = pptx.addSlide();
slide11.background = { color: LIGHT_BG };
addHeader(slide11, 'Database Schema & Entity Architecture', 'Data Model');
addFooter(slide11, 11);

const schemaEntities = [
  { group: 'IDENTITY & RBAC', entities: 'User, Student, Alumni, AdminProfile', desc: '1-to-1 relationships mapped from User identity; stores academic credentials, company roles, and verification status.' },
  { group: 'RECRUITMENT LIFECYCLE', entities: 'Job, Application, ScreeningAnswer', desc: 'Governs job postings, applicant tracking, and screening answers; foreign key cascades maintain integrity.' },
  { group: 'AI & VECTOR ENGINE', entities: 'KnowledgeDocument, KnowledgeChunk', desc: 'Stores chunked job descriptions and 768-dimensional vector embeddings for RAG retrieval.' },
  { group: 'CONVERSATION HISTORY', entities: 'AiConversation, AiMessage', desc: 'Maintains user chat sessions with model responses and linked source citation references.' },
  { group: 'AUDIT & VERIFICATION', entities: 'OcrAuditLog, AuditLog', desc: 'Stores SHA-256 document hashes, extracted fields, confidence scores, and administrative action logs.' }
];

schemaEntities.forEach((se, i) => {
  const y = 1.6 + i * 1.0;
  slide11.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.88,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide11.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 2.6, h: 0.88,
    fill: { color: 'EFF6FF' },
    line: { type: 'none' }
  });
  slide11.addText(se.group, {
    x: 0.9, y: y + 0.15, w: 2.4, h: 0.3,
    fontSize: 10, bold: true, color: NAVY
  });
  slide11.addText(se.entities, {
    x: 0.9, y: y + 0.45, w: 2.4, h: 0.3,
    fontSize: 9, bold: true, color: ORANGE
  });
  slide11.addText(se.desc, {
    x: 3.6, y: y + 0.15, w: 8.7, h: 0.6,
    fontSize: 10, color: DARK_SLATE, valign: 'middle'
  });
});

// -------------------------------------------------------------
// SLIDE 12: AI Placement Assistant (Gemini & RAG)
// -------------------------------------------------------------
const slide12 = pptx.addSlide();
slide12.background = { color: LIGHT_BG };
addHeader(slide12, 'AI Placement Assistant (Gemini & RAG)', 'Applied AI');
addFooter(slide12, 12);

const ragSteps = [
  { num: 'Step 1', title: 'Job Ingestion & Vector Indexing', text: 'Approved job posts are chunked and embedded via Google gemini-embedding-2 into 768-dim vectors stored in pgvector.' },
  { num: 'Step 2', title: 'Student Query & Embedding', text: 'When a student asks a placement question, the query is converted into an embedding in real-time.' },
  { num: 'Step 3', title: 'pgvector Cosine Search', text: 'Top-5 matching job chunks are retrieved via raw SQL cosine distance queries (ORDER BY embedding <=> query_vector).' },
  { num: 'Step 4', title: 'Structured Context Injection', text: 'The student’s verified CGPA, department, backlogs, and application history are fetched directly from PostgreSQL.' },
  { num: 'Step 5', title: 'Grounded Response Generation', text: 'Gemini 2.5 Flash synthesizes the response using strict zero-hallucination guardrails and returns source citations.' }
];

ragSteps.forEach((rs, i) => {
  const y = 1.6 + i * 1.0;
  slide12.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.88,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide12.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 1.2, h: 0.88,
    fill: { color: NAVY }, line: { type: 'none' }
  });
  slide12.addText(rs.num, {
    x: 0.8, y, w: 1.2, h: 0.88,
    fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle'
  });
  slide12.addText(rs.title, {
    x: 2.2, y: y + 0.12, w: 4.5, h: 0.3,
    fontSize: 12, bold: true, color: DARK_SLATE
  });
  slide12.addText(rs.text, {
    x: 2.2, y: y + 0.42, w: 10.0, h: 0.4,
    fontSize: 10, color: MUTED
  });
});

// -------------------------------------------------------------
// SLIDE 13: OCR-Based Document Verification Engine
// -------------------------------------------------------------
const slide13 = pptx.addSlide();
slide13.background = { color: LIGHT_BG };
addHeader(slide13, 'OCR Document Verification Engine', 'Computer Vision');
addFooter(slide13, 13);

const ocrBoxes = [
  { title: '1. Tamper & Duplicate Detection', desc: 'Computes SHA-256 hash of certificate buffer; rejects instantly if hash matches previously verified registrations.' },
  { title: '2. Sharp Image Preprocessing', desc: 'Enhances scanned document contrast, normalizes DPI, and eliminates visual noise prior to text recognition.' },
  { title: '3. Neural OCR Extraction', desc: 'Tesseract.js worker executes Page Segmentation Mode (PSM 3) English character extraction.' },
  { title: '4. Tri-Factor Fuzzy Matching', desc: 'Evaluates VVITU institutional tokens, extracts normalized alphanumeric roll number, and computes Dice similarity for name.' },
  { title: '5. Central Decision Matrix', desc: 'All fields match (>85%) -> VERIFIED\nDiscrepancies found -> REJECTED\nLow image clarity -> PENDING_MANUAL_REVIEW' },
  { title: '6. Full Audit Traceability', desc: 'Every verification result, raw text snippet, confidence score, and IP address is persisted to ocr_audit_logs.' }
];

ocrBoxes.forEach((ob, i) => {
  const x = 0.8 + (i % 2) * 6.0;
  const y = 1.6 + Math.floor(i / 2) * 1.7;

  slide13.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.7, h: 1.5,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide13.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.7, h: 0.08,
    fill: { color: ORANGE }, line: { type: 'none' }
  });
  slide13.addText(ob.title, {
    x: x + 0.3, y: y + 0.18, w: 5.1, h: 0.35,
    fontSize: 12, bold: true, color: DARK_SLATE
  });
  slide13.addText(ob.desc, {
    x: x + 0.3, y: y + 0.55, w: 5.1, h: 0.85,
    fontSize: 10, color: MUTED, lineSpacing: 15
  });
});

// -------------------------------------------------------------
// SLIDE 14: Security, RBAC & Data Safeguards
// -------------------------------------------------------------
const slide14 = pptx.addSlide();
slide14.background = { color: LIGHT_BG };
addHeader(slide14, 'Security Architecture & Data Protection', 'Defense-in-Depth');
addFooter(slide14, 14);

const secLayers = [
  { layer: 'Layer 1: Network & Session', title: 'HttpOnly Cookie JWT Authentication', desc: 'Tokens transmitted exclusively via HttpOnly, SameSite: Lax cookies, preventing JavaScript access and token theft via XSS.' },
  { layer: 'Layer 2: Access Control', title: 'Strict IDOR & Multi-Role Authorization', desc: 'Middleware enforces role verification; cross-tenant student checks prevent unauthorized access to peer resumes or applications.' },
  { layer: 'Layer 3: Cryptography', title: 'Bcrypt Password Hashing & Salts', desc: 'User passwords hashed using bcryptjs with 10 salt rounds; mandatory password update flow upon initial administrative provisioning.' },
  { layer: 'Layer 4: Data Validation', title: 'Zod Schemas & Parameterized Queries', desc: 'All incoming API payloads sanitized via Zod schemas; Prisma ORM parameterization neutralizes SQL injection vectors.' },
  { layer: 'Layer 5: Storage Hardening', title: 'MIME Validation & Path Sanitization', desc: 'File uploads restricted to PDF/PNG/JPEG under 10MB; path sanitization prevents directory traversal attacks.' }
];

secLayers.forEach((sl, i) => {
  const y = 1.6 + i * 1.0;
  slide14.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11.7, h: 0.88,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 }
  });
  slide14.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 2.2, h: 0.88,
    fill: { color: '065F46' }, line: { type: 'none' }
  });
  slide14.addText(sl.layer, {
    x: 0.8, y, w: 2.2, h: 0.88,
    fontSize: 9.5, bold: true, color: WHITE, align: 'center', valign: 'middle'
  });
  slide14.addText(sl.title, {
    x: 3.2, y: y + 0.12, w: 4.5, h: 0.3,
    fontSize: 12, bold: true, color: DARK_SLATE
  });
  slide14.addText(sl.desc, {
    x: 3.2, y: y + 0.42, w: 9.0, h: 0.4,
    fontSize: 10, color: MUTED
  });
});

// -------------------------------------------------------------
// SLIDE 15: Testing, Limitations & Future Scope
// -------------------------------------------------------------
const slide15 = pptx.addSlide();
slide15.background = { color: LIGHT_BG };
addHeader(slide15, 'Validation, Limitations & Roadmap', 'Engineering Audit');
addFooter(slide15, 15);

// Left Column: Test Evidence
slide15.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.6, w: 5.7, h: 5.0,
  fill: { color: CARD_BG },
  line: { color: BORDER_COLOR, width: 1 }
});
slide15.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.6, w: 5.7, h: 0.1,
  fill: { color: '059669' }, line: { type: 'none' }
});
slide15.addText('TEST SUITE & DEMONSTRATED RESULTS', {
  x: 1.1, y: 1.85, w: 5.1, h: 0.3,
  fontSize: 12, bold: true, color: '059669'
});
slide15.addText([
  { text: '• 36 Automated Jest Test Suites\n', options: { bold: true, color: DARK_SLATE } },
  { text: '  - matching-engine.test.js: 6-factor weighted score accuracy\n  - idor.test.js: Cross-student data boundary enforcement\n  - ocr-verification-engine.test.js: Fuzzy match tolerances\n  - job-expiry.test.js: Automatic expiry cron validation\n\n', options: { color: MUTED } },
  { text: '• Sub-Second Vector Query Performance\n', options: { bold: true, color: DARK_SLATE } },
  { text: '  - pgvector cosine distance search retrieves within 45ms.\n', options: { color: MUTED } },
  { text: '• Verified End-to-End Onboarding\n', options: { bold: true, color: DARK_SLATE } },
  { text: '  - Successful alumni registration and certificate verification.', options: { color: MUTED } }
], {
  x: 1.1, y: 2.2, w: 5.1, h: 4.2,
  fontSize: 10, lineSpacing: 16
});

// Right Column: Limitations & Roadmap
slide15.addShape(pptx.ShapeType.rect, {
  x: 6.8, y: 1.6, w: 5.7, h: 5.0,
  fill: { color: CARD_BG },
  line: { color: BORDER_COLOR, width: 1 }
});
slide15.addShape(pptx.ShapeType.rect, {
  x: 6.8, y: 1.6, w: 5.7, h: 0.1,
  fill: { color: ORANGE }, line: { type: 'none' }
});
slide15.addText('CURRENT LIMITATIONS & FUTURE ROADMAP', {
  x: 7.1, y: 1.85, w: 5.1, h: 0.3,
  fontSize: 12, bold: true, color: ORANGE
});
slide15.addText([
  { text: '• Known Engineering Constraints:\n', options: { bold: true, color: DARK_SLATE } },
  { text: '  - Synchronous OCR execution takes 2–4s for high-res images.\n  - Local storage fallback used in dev environment.\n\n', options: { color: MUTED } },
  { text: '• Future Architectural Roadmap:\n', options: { bold: true, color: NAVY } },
  { text: '  1. Asynchronous Job Queue:\n     Integrate BullMQ + Redis for background OCR parsing.\n  2. Event-Driven Notifications:\n     Automated WhatsApp & Email interview shortlisting alerts.\n  3. Semantic Resume Scoring:\n     Direct vector similarity matching between resume & job description.\n  4. Live Coding Profile Sync:\n     Automatic API sync with LeetCode & HackerRank.', options: { color: MUTED } }
], {
  x: 7.1, y: 2.2, w: 5.1, h: 4.2,
  fontSize: 10, lineSpacing: 16
});

// -------------------------------------------------------------
// SLIDE 16: Conclusion & Demonstration
// -------------------------------------------------------------
const slide16 = pptx.addSlide();
slide16.background = { color: NAVY };

slide16.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 0.3, h: 7.5,
  fill: { color: ORANGE }, line: { type: 'none' }
});

slide16.addText('CONCLUSION & REVIEW', {
  x: 1.0, y: 1.2, w: 11.0, h: 0.3,
  fontSize: 12, bold: true, color: '93C5FD'
});

slide16.addText('Summary of Project Contributions', {
  x: 1.0, y: 1.6, w: 11.0, h: 0.8,
  fontSize: 32, bold: true, color: WHITE
});

slide16.addShape(pptx.ShapeType.rect, {
  x: 1.0, y: 2.5, w: 11.3, h: 0.05,
  fill: { color: ORANGE }, line: { type: 'none' }
});

const conclusionCards = [
  { title: 'Operational Excellence', text: 'Transformed fragmented spreadsheet operations into a high-performance, role-governed placement portal.' },
  { title: 'Academic & System Trust', text: 'Neural OCR verification guarantees that only legitimate alumni post jobs, protecting student welfare.' },
  { title: 'Intelligent Automation', text: 'Pioneered pgvector semantic retrieval and Google Gemini 2.5 Flash for grounded placement assistance.' },
  { title: 'Production Ready', text: 'Fully containerized with Docker, verified with 36 test suites, and ready for institutional deployment.' }
];

conclusionCards.forEach((cc, i) => {
  const x = 1.0 + (i % 2) * 5.8;
  const y = 2.8 + Math.floor(i / 2) * 1.5;

  slide16.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.5, h: 1.3,
    fill: { color: '0F3B66' },
    line: { color: '1D4ED8', width: 1 }
  });
  slide16.addText(cc.title, {
    x: x + 0.3, y: y + 0.15, w: 4.9, h: 0.3,
    fontSize: 13, bold: true, color: 'FDBA74'
  });
  slide16.addText(cc.text, {
    x: x + 0.3, y: y + 0.45, w: 4.9, h: 0.75,
    fontSize: 10.5, color: 'E2E8F0', lineSpacing: 16
  });
});

slide16.addText('Thank You! We are now open for Questions & Live Demonstration.', {
  x: 1.0, y: 6.0, w: 11.3, h: 0.6,
  fontSize: 16, bold: true, color: WHITE, align: 'center'
});

// Output presentation file
const outputPath = path.resolve('d:/Projects/VVITU Placement Portal/docs/presentation/VVITU_Placement_Portal_Major_Project.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`[SUCCESS] Presentation generated successfully at: ${outputPath}`);
  })
  .catch((err) => {
    console.error(`[ERROR] Failed to generate PPTX:`, err);
    process.exit(1);
  });
