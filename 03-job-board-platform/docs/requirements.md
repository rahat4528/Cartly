# Job Board Platform — Functional & System Requirements

## 1. Domain & Purpose

The Job Board Platform is a professional recruitment marketplace connecting qualified candidates (job seekers) with verified companies and hiring teams. It streamlines career discovery, verified employer profiles, confidential resume processing, and full-lifecycle applicant tracking.

---

## 2. User Roles & Capabilities

### 2.1 Job Seeker / Candidate
- **Account & Profile**: Register, authenticate (JWT with refresh), build professional profile (title, summary, skills tags, portfolio links, location, desired salary).
- **Resume Management**: Upload PDF/DOCX resume file with private access control; parsed keyword extraction.
- **Job Discovery & Search**:
  - Full-text search across Title, Description, and Company Name.
  - Faceted filters: Job Category (Engineering, Design, Marketing, Product, Finance), Work Type (Full-time, Contract, Remote, Hybrid), Location, and Minimum Annual Salary.
- **Application Workflow**:
  - One-click application with selected resume and cover note.
  - Duplicate application prevention (strictly one active application per seeker per job).
  - Track application status in candidate dashboard (`APPLIED` &rarr; `REVIEWED` &rarr; `SHORTLISTED` &rarr; `INTERVIEW` &rarr; `OFFERED` / `REJECTED` / `WITHDRAWN`).
- **Saved Jobs & Alerts**: Save jobs for later review; subscribe to automated keyword job alerts.

### 2.2 Employer / Hiring Manager
- **Employer Onboarding**: Register company profile (name, logo, website, description, team size, headquarters location).
- **Job Publishing & Lifecycle**:
  - Post new jobs with salary range, required skills, job type, and expiration date.
  - Edit active listings; archive or expire filled listings.
- **Applicant Tracking Pipeline (ATS)**:
  - Review incoming candidate applications.
  - Inspect private candidate resumes via authorized signed endpoints.
  - Filter candidates by matched skills percentage (transparent keyword-based matching).
  - Advance candidates through interview stages with structured interview scheduling and candidate status history logs.
- **Hiring Analytics**: Track applicant volume, conversion rates, and time-to-hire.

### 2.3 System Administrator
- **User Management**: Manage seeker and employer accounts.
- **Employer Verification**: Review company credentials and assign verified-employer badges.
- **Job Moderation**: Audit active listings for spam or deceptive salary claims; unpublish violating jobs.
- **Taxonomy Management**: Manage job categories and standard skill registries.

---

## 3. Data Integrity & Security Rules

1. **Strict One Application Per Job**: Database unique constraint `[jobId, seekerId]` prevents candidates from submitting duplicate applications for the same opening.
2. **Private Resume Access Control**: Candidate resumes are confidential. Access is granted exclusively to the owning candidate and verified employers who own the job to which the candidate applied.
3. **Expired & Inactive Job Safeguards**: Expired (`expiresAt < now`) or unpublished/archived jobs strictly reject new applications.
4. **Application Status Machine & Audit History**: Every state transition must append an immutable record to `ApplicationStatusHistory` (`applicationId`, `fromStatus`, `toStatus`, `changedBy`, `note`, `timestamp`).
5. **Skill Matching Transparency**: The matching engine evaluates overlap between candidate skills and job requirements using deterministic keyword matching, clearly labeled as keyword-based scoring without unconfigured third-party claims.
