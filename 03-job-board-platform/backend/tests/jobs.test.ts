import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { JobBoardStore } from '../src/database/store.js';
import { SkillMatchingEngine } from '../src/matching/skill-matching.js';
import { ApplicationStateMachine } from '../src/applications/state-machine.js';

describe('Job Board Platform Test Suite', () => {
  let app: any;
  let store: JobBoardStore;
  let seekerToken: string;
  let employer1Token: string;
  let employer2Token: string;

  beforeEach(async () => {
    store = JobBoardStore.getInstance();
    store.resetToSeed();
    app = createApp();

    // Authenticate candidate
    const seekerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'candidate@cartly.local', password: 'Pass123!' });
    seekerToken = seekerRes.body.token;

    // Authenticate Employer 1 (Nova Cloud Labs)
    const emp1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employer@cartly.local', password: 'Pass123!' });
    employer1Token = emp1Res.body.token;

    // Authenticate Employer 2 (Apex Autonomous Systems)
    const emp2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employer2@cartly.local', password: 'Pass123!' });
    employer2Token = emp2Res.body.token;
  });

  // ==================== 1. UNIT: MATCHING & STATE MACHINE ====================
  describe('Unit: Keyword Skill Matching & Status Machine', () => {
    it('computes transparent keyword match score percentage and identifies missing skills', () => {
      const candidateSkills = ['Go', 'Kubernetes', 'PostgreSQL', 'Redis'];
      const requiredSkills = ['Distributed Systems', 'Go', 'Kubernetes', 'PostgreSQL', 'Redis'];

      const result = SkillMatchingEngine.evaluate(candidateSkills, requiredSkills);
      // 4 out of 5 matched = 80%
      expect(result.matchScore).toBe(80);
      expect(result.matchedSkills).toEqual(['Go', 'Kubernetes', 'PostgreSQL', 'Redis']);
      expect(result.missingSkills).toEqual(['Distributed Systems']);
      expect(result.engineType).toBe('KEYWORD_MATCHING');
    });

    it('enforces ATS application status transitions', () => {
      expect(ApplicationStateMachine.canTransition('APPLIED', 'REVIEWED')).toBe(true);
      expect(ApplicationStateMachine.canTransition('REVIEWED', 'SHORTLISTED')).toBe(true);
      expect(ApplicationStateMachine.canTransition('SHORTLISTED', 'INTERVIEW')).toBe(true);
      expect(ApplicationStateMachine.canTransition('INTERVIEW', 'OFFERED')).toBe(true);

      // Illegal jumps
      expect(ApplicationStateMachine.canTransition('APPLIED', 'OFFERED')).toBe(false);
      expect(() => ApplicationStateMachine.validate('APPLIED', 'OFFERED')).toThrow();
    });
  });

  // ==================== 2. APPLICATION INTEGRATION & DUPLICATE BLOCKING ====================
  describe('Application Submission & Expiration Guards', () => {
    it('successfully submits candidate application and appends to status history', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/job_001/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          resumeId: 'res_default_alex',
          coverNote: 'Excited about geo-replicated consensus networks.'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('APPLIED');
      expect(res.body.matchScore).toBeGreaterThan(0);

      // Verify status history audit
      const histories = store.statusHistories.filter(h => h.applicationId === res.body.id);
      expect(histories.length).toBe(1);
      expect(histories[0].toStatus).toBe('APPLIED');
    });

    it('strictly blocks duplicate applications for the same job from the same candidate', async () => {
      // First application succeeds
      await request(app)
        .post('/api/v1/jobs/job_001/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ resumeId: 'res_default_alex' });

      // Second application for job_001 MUST be rejected
      const dupRes = await request(app)
        .post('/api/v1/jobs/job_001/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ resumeId: 'res_default_alex' });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.error).toContain('Duplicate application');
    });

    it('rejects applications for expired jobs', async () => {
      // job_004 has expiresAt in 2020
      const res = await request(app)
        .post('/api/v1/jobs/job_004/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ resumeId: 'res_default_alex' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('expired');
    });
  });

  // ==================== 3. CROSS-EMPLOYER ISOLATION & ATS PIPELINE ====================
  describe('Cross-Employer Access Isolation', () => {
    beforeEach(async () => {
      // Candidate applies to job_001 owned by Employer 1 (Nova Cloud Labs)
      await request(app)
        .post('/api/v1/jobs/job_001/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ resumeId: 'res_default_alex' });
    });

    it('allows Employer 1 to view applicants for their own job', async () => {
      const res = await request(app)
        .get('/api/v1/employer/jobs/job_001/applications')
        .set('Authorization', `Bearer ${employer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].jobId).toBe('job_001');
    });

    it('strictly blocks Employer 2 from viewing applicants of Employer 1', async () => {
      const res = await request(app)
        .get('/api/v1/employer/jobs/job_001/applications')
        .set('Authorization', `Bearer ${employer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('An employer cannot access applicants for jobs owned by another company');
    });
  });

  // ==================== 4. RESUME ACCESS CONTROL ====================
  describe('Confidential Resume Access Control', () => {
    it('authorizes the owning candidate and the interviewing employer to view resume', async () => {
      // Candidate applies to job_001
      await request(app)
        .post('/api/v1/jobs/job_001/apply')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({ resumeId: 'res_default_alex' });

      // 1. Candidate access: authorized
      const seekerAccess = await request(app)
        .get('/api/v1/resumes/res_default_alex')
        .set('Authorization', `Bearer ${seekerToken}`);
      expect(seekerAccess.status).toBe(200);
      expect(seekerAccess.body.accessType).toBe('OWNER');

      // 2. Employer 1 (who received the application): authorized
      const emp1Access = await request(app)
        .get('/api/v1/resumes/res_default_alex')
        .set('Authorization', `Bearer ${employer1Token}`);
      expect(emp1Access.status).toBe(200);
      expect(emp1Access.body.accessType).toBe('EMPLOYER_APPLICATION');

      // 3. Employer 2 (unrelated company): forbidden
      const emp2Access = await request(app)
        .get('/api/v1/resumes/res_default_alex')
        .set('Authorization', `Bearer ${employer2Token}`);
      expect(emp2Access.status).toBe(403);
      expect(emp2Access.body.error).toContain('Access Denied');
    });
  });
});
