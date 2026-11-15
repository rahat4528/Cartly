import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../backend/src/app.js';
import { JobBoardStore } from '../backend/src/database/store.js';

describe('E2E Recruitment Journey: Search -> Apply -> Duplicate Guard -> ATS Pipeline -> Status Audit', () => {
  let app: any;
  let store: JobBoardStore;

  beforeEach(() => {
    store = JobBoardStore.getInstance();
    store.resetToSeed();
    app = createApp();
  });

  it('completes the complete candidate and employer recruitment lifecycle', async () => {
    // 1. Candidate registers
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'alex.dev@cartly.local',
        password: 'Password123!',
        name: 'Alex Rivera',
        role: 'CANDIDATE'
      });
    expect(regRes.status).toBe(201);
    const candidateToken = regRes.body.token;
    expect(candidateToken).toBeDefined();

    // 2. Candidate searches for jobs matching 'Kubernetes' and 'Remote'
    const searchRes = await request(app)
      .get('/api/v1/jobs?query=Kubernetes&location=Remote&jobType=FULL_TIME');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.jobs.length).toBeGreaterThan(0);
    const targetJob = searchRes.body.jobs[0];
    expect(targetJob.title).toBeDefined();

    // 3. Candidate submits job application with skills and resume URL
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${targetJob.id}/apply`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        resumeUrl: 'https://storage.cartly.local/resumes/alex-rivera-cv.pdf',
        coverNote: 'I have 6 years of experience managing Kubernetes clusters and cloud architectures.',
        candidateSkills: ['Go', 'Kubernetes', 'PostgreSQL', 'Docker', 'AWS', 'Distributed Systems']
      });
    expect(applyRes.status).toBe(201);
    expect(applyRes.body.status).toBe('APPLIED');
    expect(applyRes.body.matchScore).toBeGreaterThanOrEqual(70);
    expect(applyRes.body.matchedSkills).toContain('Kubernetes');
    const applicationId = applyRes.body.id;

    // 4. Concurrency / Duplicate Prevention: Immediate second application attempt is blocked
    const duplicateRes = await request(app)
      .post(`/api/v1/jobs/${targetJob.id}/apply`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        resumeUrl: 'https://storage.cartly.local/resumes/alex-rivera-cv.pdf',
        coverNote: 'Second submission should be rejected.'
      });
    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.error).toContain('Duplicate application');

    // 5. Candidate views their own application tracker
    const myAppsRes = await request(app)
      .get('/api/v1/seeker/applications')
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(myAppsRes.status).toBe(200);
    expect(myAppsRes.body.length).toBe(1);
    expect(myAppsRes.body[0].jobId).toBe(targetJob.id);

    // 6. Employer logs in
    const empLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'employer@cartly.local',
        password: 'Pass123!'
      });
    expect(empLoginRes.status).toBe(200);
    const employerToken = empLoginRes.body.token;

    // 7. Employer retrieves applications for their job posting
    const jobAppsRes = await request(app)
      .get(`/api/v1/employer/jobs/${targetJob.id}/applications`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(jobAppsRes.status).toBe(200);
    const submittedApp = jobAppsRes.body.find((a: any) => a.id === applicationId);
    expect(submittedApp).toBeDefined();
    expect(submittedApp.seekerName).toBe('Alex Rivera');
    expect(submittedApp.status).toBe('APPLIED');

    // 8. Employer inspects confidential candidate application details
    const appDetailRes = await request(app)
      .get(`/api/v1/employer/applications/${applicationId}`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(appDetailRes.status).toBe(200);
    expect(appDetailRes.body.resumeUrl).toBe('https://storage.cartly.local/resumes/alex-rivera-cv.pdf');
    expect(appDetailRes.body.statusHistory.length).toBe(1);

    // 9. Employer advances ATS pipeline: APPLIED -> REVIEWED -> SHORTLISTED -> INTERVIEW
    const reviewRes = await request(app)
      .patch(`/api/v1/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'REVIEWED', note: 'Initial resume screening passed.' });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.status).toBe('REVIEWED');

    const shortlistRes = await request(app)
      .patch(`/api/v1/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'SHORTLISTED', note: 'Top match based on skills assessment.' });
    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.status).toBe('SHORTLISTED');

    const interviewRes = await request(app)
      .patch(`/api/v1/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'INTERVIEW', note: 'Technical deep-dive scheduled.' });
    expect(interviewRes.status).toBe(200);
    expect(interviewRes.body.status).toBe('INTERVIEW');

    // 10. Verify complete audit trail of status transitions
    const finalDetailRes = await request(app)
      .get(`/api/v1/employer/applications/${applicationId}`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(finalDetailRes.status).toBe(200);
    const history = finalDetailRes.body.statusHistory;
    expect(history.length).toBe(4);
    expect(history.map((h: any) => h.toStatus)).toEqual(['APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW']);

    // 11. Cross-employer boundary isolation test: Another employer cannot inspect or mutate this application
    const emp2LoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'employer2@cartly.local',
        password: 'Pass123!'
      });
    expect(emp2LoginRes.status).toBe(200);
    const employer2Token = emp2LoginRes.body.token;

    const unauthorizedAccessRes = await request(app)
      .get(`/api/v1/employer/applications/${applicationId}`)
      .set('Authorization', `Bearer ${employer2Token}`);
    expect(unauthorizedAccessRes.status).toBe(403);

    const unauthorizedStatusUpdateRes = await request(app)
      .patch(`/api/v1/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employer2Token}`)
      .send({ status: 'REJECTED' });
    expect(unauthorizedStatusUpdateRes.status).toBe(400); // throws Forbidden caught and returned
  });
});
