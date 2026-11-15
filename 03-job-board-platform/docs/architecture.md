# Job Board Platform — Architecture & Domain Design

## 1. System Structure

```
03-job-board-platform/
├── backend/                  # NestJS / Modular Express Architecture
│   ├── src/
│   │   ├── auth/             # Multi-role authentication (SEEKER, EMPLOYER, ADMIN)
│   │   ├── jobs/             # Job catalog, faceted search, expiration lifecycle
│   │   ├── applications/     # ATS pipeline, status machine, status history ledger
│   │   ├── resumes/          # Private resume storage and signed access guards
│   │   ├── matching/         # Keyword skill matching algorithm
│   │   ├── alerts/           # Job alert matching worker
│   │   ├── admin/            # Verification, moderation, taxonomy
│   │   └── database/         # Transactional datastore
├── frontend/                 # Next.js App Router (Trust-Oriented Recruitment UI)
│   ├── src/
│   │   ├── app/              # Candidate search, ATS dashboard, company portal, admin
│   │   ├── components/       # Pipeline kanban, badge chips, resume viewer
│   │   └── lib/              # API client, auth context
├── database/                 # Prisma schema & seed script
│   ├── schema.prisma         # Relational schema (cartly_job_board_db)
│   └── seed.ts               # Tech companies, roles, skills, seekers seed
├── tests/                    # Automated test suites
│   ├── unit/                 # Status machine, skill matching, expiration checks
│   ├── integration/          # Duplicate application guard, resume authorization
│   └── e2e/                  # Full hiring journey from post to interview offer
├── docker-compose.yml        # PostgreSQL & Redis
├── .env.example
└── README.md
```

---

## 2. Domain State Machines

### 2.1 Application Status Lifecycle
```
             [APPLIED]
                 │
           Employer Views
                 ▼
            [REVIEWED]
                 │
           Qualifies
                 ▼
           [SHORTLISTED] ──┐
                 │         │
          Schedule Interview│
                 ▼         │
            [INTERVIEW]    │
                 │         │
        Decision Reached   │
        ┌────────┴────────┐│
        ▼                 ▼▼
    [OFFERED]         [REJECTED]
```

Candidate Withdrawal Branch:
- Candidate can transition any active state prior to `OFFERED` to `WITHDRAWN`.

---

## 3. Relational Data Model (Prisma)

Target Database: `cartly_job_board_db`

Entities:
- `User`: Core authentication record (`id`, `email`, `passwordHash`, `role: JOB_SEEKER | EMPLOYER | ADMIN`).
- `JobSeekerProfile`: Candidate details (`userId`, `title`, `bio`, `desiredSalary`, `location`, `skills[]`).
- `Employer`: Hiring manager account linked to `Company`.
- `Company`: Employer organization (`id`, `name`, `slug`, `website`, `logo`, `isVerified`, `description`, `headquarters`).
- `Job`: Published job listing (`id`, `companyId`, `title`, `slug`, `description`, `categoryId`, `jobType`, `minSalary`, `maxSalary`, `location`, `requiredSkills[]`, `isPublished`, `expiresAt`, `createdAt`).
- `JobCategory`: Taxonomy grouping (`id`, `name`, `slug`).
- `Resume`: Uploaded candidate resume (`id`, `seekerId`, `filename`, `fileUrl`, `parsedKeywords[]`, `uploadedAt`).
- `JobApplication`: Formal application (`id`, `jobId`, `seekerId`, `resumeId`, `coverNote`, `status`, `createdAt`, `updatedAt`).
- `ApplicationStatusHistory`: Audit log (`id`, `applicationId`, `fromStatus`, `toStatus`, `changedBy`, `note`, `timestamp`).
- `SavedJob`: Candidate bookmark (`seekerId`, `jobId`, `savedAt`).
- `Interview`: Scheduled interview record (`id`, `applicationId`, `scheduledAt`, `meetingLink`, `notes`).
- `JobAlert`: Candidate alert subscription (`id`, `seekerId`, `keywords`, `categoryId`, `minSalary`, `createdAt`).
