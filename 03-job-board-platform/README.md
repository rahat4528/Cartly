# Job Board Platform (Cartly - Phase 3)

A full-stack, standalone recruitment marketplace and applicant tracking platform built with Next.js 14 App Router, Express, TypeScript, and Tailwind CSS. The system provides an end-to-end hiring ecosystem connecting engineering talent with verified employers through transparent keyword-based skill match scoring, ATS pipeline status progression, and strict confidential candidate data isolation.

---

## 1. Features

### Job Seekers & Candidates
- **Search & Filter Matrix**: Full-text keyword search across job titles, descriptions, and technology stacks, combined with location filters (Remote, Onsite, Hybrid) and employment type (Full-Time, Contract).
- **Salary Transparency**: Min and max annual compensation ranges clearly highlighted on every listing.
- **Skill Match Score Breakdown**: Deterministic, transparent keyword matching engine evaluating candidate skill sets against required competencies, displaying match percentage, overlapping proficiencies, and missing skills.
- **Job Application Pipeline**: One-click application submission with confidential resume storage links and personalized cover letters.
- **Duplicate Application Prevention**: Concurrency and transactional guards prevent submitting duplicate applications for the same role.
- **Personal Application Tracker**: Real-time visibility into application lifecycle stages from submission to interview.

### Employers & Recruiters
- **Company Profile Verification**: Verified employer badges designating authentic corporate listings.
- **Job Requisition Management**: Draft, publish, edit, and archive job requisitions with automatic expiration timestamps (30-day default).
- **Kanban-Style ATS Pipeline**: Candidate status progression through strictly enforced state transitions (`APPLIED` &rarr; `REVIEWED` &rarr; `SHORTLISTED` &rarr; `INTERVIEW` &rarr; `OFFERED` or `REJECTED`).
- **Complete Status Transition Audit History**: Immutable audit log capturing status transitions, timestamps, reviewer identity, and contextual screening notes.
- **Cross-Employer Data Isolation**: Strict multi-tenant security ensuring confidential candidate resumes and applications are accessible only by the verified hiring team that created the requisition.

---

## 2. Architecture & Tech Stack

```
03-job-board-platform/
├── backend/
│   ├── src/
│   │   ├── applications/   # ATS state machine, application service, and status audit
│   │   ├── auth/           # JWT authentication, role guards (CANDIDATE, EMPLOYER, ADMIN)
│   │   ├── database/       # In-memory transactional datastore & seed generator
│   │   ├── jobs/           # Requisitions, filters, and expiration lifecycle
│   │   ├── matching/       # Transparent keyword skill match engine
│   │   ├── app.ts          # Express application setup, routes, and security middlewares
│   │   └── server.ts       # Server listener
│   └── tests/              # Unit & integration test suites
├── frontend/               # Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/            # Landing/search (/), candidate portal (/applications), ATS pipeline (/employer)
│   │   ├── components/     # Navigation, headers, status badges
│   │   └── lib/            # API client and authentication context provider
├── database/
│   ├── schema.prisma       # Prisma schema for PostgreSQL deployment
│   └── seed.ts             # Initial seed fixtures
├── docs/                   # Requirements, architecture, API, and completion report
├── docker-compose.yml      # Dedicated PostgreSQL & Redis container definitions
├── package.json            # Monorepo task runner & test runner scripts
└── README.md
```

### Technology Matrix
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Express.js, TypeScript, jsonwebtoken, bcryptjs, cors, helmet
- **Database (Production)**: PostgreSQL (`cartly_job_board_db`) with Prisma ORM
- **Cache / Queues (Production)**: Redis for session caching and expiration workers
- **Testing**: Vitest, Supertest

---

## 3. Getting Started

### Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0
- Docker & Docker Compose (optional, for standalone database container)

### Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

### Installation
Install dependencies across both backend and frontend:
```bash
# In the 03-job-board-platform folder
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Running the Services

#### 1. Start the Backend API
```bash
npm run dev:backend
# API server starts on http://localhost:4003
```

#### 2. Start the Frontend Application
```bash
npm run dev:frontend
# Web interface starts on http://localhost:3003
```

---

## 4. Demo Accounts & Seed Credentials

The local seed database includes pre-configured roles for immediate exploration:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Candidate** | `candidate@cartly.local` | `Pass123!` | Active job seeker with pre-loaded technical profile |
| **Employer 1** | `employer@cartly.local` | `Pass123!` | Recruiter at Nova Cloud Labs (owns distributed systems requisitions) |
| **Employer 2** | `employer2@cartly.local` | `Pass123!` | Recruiter at Apex Autonomous Systems |
| **Platform Admin** | `admin@cartly.local` | `AdminPass123!` | Platform supervisor with company verification rights |

---

## 5. API Reference

All endpoints are versioned under `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` - Create a candidate or employer account
- `POST /api/v1/auth/login` - Authenticate and receive a JWT session bearer token
- `GET /api/v1/auth/me` - Retrieve current authenticated profile

### Jobs Repertoire
- `GET /api/v1/jobs` - Search and filter active jobs (`q`, `location`, `jobType`, `department`)
- `GET /api/v1/jobs/:id` - Detailed job requisition with required skills and employer verification
- `POST /api/v1/jobs` - Create new job posting (Employer only)
- `POST /api/v1/jobs/:id/apply` - Submit an application with resume link and skills (Candidate only)

### ATS & Application Management
- `GET /api/v1/applications/my-applications` - View submitted applications (Candidate only)
- `GET /api/v1/applications/job/:jobId` - Fetch all applicants for owned job (Employer only)
- `GET /api/v1/applications/:id` - Detailed applicant profile, resume, and audit log (Authorized Employer only)
- `PATCH /api/v1/applications/:id/status` - Transition applicant status (`APPLIED` &rarr; `REVIEWED` &rarr; `SHORTLISTED` &rarr; `INTERVIEW` &rarr; `OFFERED` / `REJECTED`)

---

## 6. Testing

Run all unit, integration, and end-to-end tests:
```bash
# Execute full test suite
npm test

# Run backend unit & integration tests
npm run test:backend

# Run end-to-end recruitment lifecycle tests
npm run test:e2e
```

---

## 7. Known Limitations
- Background resume virus scanning and text OCR extraction are simulated in local development via deterministic keyword evaluation.
- Live email and SMS notifications for status updates log to the console rather than dispatching via SMTP providers.
