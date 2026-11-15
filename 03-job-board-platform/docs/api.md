# Job Board Platform — REST API Specification

Base URL: `/api/v1`

---

## 1. Authentication & Profiles

### `POST /auth/register` & `POST /auth/login`
Supports `role: "JOB_SEEKER" | "EMPLOYER"`.

### `GET /seeker/profile` & `PATCH /seeker/profile`
Manage seeker career summary, skill tags, and preferences.

### `POST /seeker/resumes` & `GET /seeker/resumes`
Upload and retrieve candidate resumes.

---

## 2. Job Listings & Public Search

### `GET /jobs`
Paginated search and faceted filters:
- Parameters: `query`, `categoryId`, `jobType`, `location`, `minSalary`, `page`, `limit`.

### `GET /jobs/:idOrSlug`
Retrieve job details, required skills, company profile, and application status if authenticated.

### `POST /seeker/jobs/:id/save` & `DELETE /seeker/jobs/:id/save`
Toggle saved jobs.

---

## 3. Applications & ATS Pipeline

### `POST /jobs/:id/apply`
Submit application for job.
- **Rules**: Enforces one application per seeker per job. Rejects expired jobs.
- **Body**: `{ "resumeId": "res_123", "coverNote": "..." }`

### `GET /seeker/applications`
Retrieve candidate's active and historical applications with status timelines.

### `GET /employer/jobs/:id/applications`
Employer pipeline view of candidates who applied to their job.
- Includes computed skill match percentage and resume access.

### `PATCH /employer/applications/:id/status`
Advance candidate through ATS pipeline:
- **Body**: `{ "status": "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED", "note": "..." }`
- Appends to `ApplicationStatusHistory`.

### `POST /employer/applications/:id/interview`
Schedule candidate interview.

---

## 4. Employer Management

### `POST /employer/jobs` & `PATCH /employer/jobs/:id`
Create and update job postings.

### `GET /employer/dashboard`
Employer hiring metrics and active openings.

---

## 5. Administration

### `PATCH /admin/employers/:id/verify`
Toggle verified-employer status badge.

### `PATCH /admin/jobs/:id/unpublish`
Unpublish or moderate violating listings.
