import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireEmployer, AuthenticatedRequest } from './auth/auth.guard.js';
import { JobsService } from './jobs/jobs.service.js';
import { ApplicationsService } from './applications/applications.service.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const jobsService = new JobsService();
  const applicationsService = new ApplicationsService();

  const api = express.Router();

  // Health
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: '03-job-board-platform-api', timestamp: new Date().toISOString() });
  });

  // Auth
  api.post('/auth/register', async (req, res) => {
    try {
      const data = await authService.register(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/auth/login', async (req, res) => {
    try {
      const data = await authService.login(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  api.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Jobs Search & Catalog
  api.get('/jobs', (req, res) => {
    const options = {
      query: req.query.query as string,
      categoryId: req.query.categoryId as string,
      jobType: req.query.jobType as string,
      location: req.query.location as string,
      minSalary: req.query.minSalary ? Number(req.query.minSalary) : undefined,
      sort: req.query.sort as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10
    };
    res.json(jobsService.getJobs(options));
  });

  api.get('/jobs/categories', (_req, res) => {
    res.json(jobsService.getCategories());
  });

  api.get('/jobs/:idOrSlug', (req, res) => {
    const job = jobsService.getJobByIdOrSlug(req.params.idOrSlug);
    if (!job) return res.status(404).json({ error: 'Job listing not found' });
    res.json(job);
  });

  // Application Submission
  api.post('/jobs/:id/apply', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { resumeId, coverNote, candidateSkills, resumeUrl } = req.body;
      const application = applicationsService.apply(
        req.user!.sub,
        req.params.id,
        resumeId,
        coverNote,
        candidateSkills,
        resumeUrl
      );
      res.status(201).json(application);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Candidate Applications
  api.get('/seeker/applications', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(applicationsService.getSeekerApplications(req.user!.sub));
  });

  // Employer Operations & ATS Pipeline
  api.get('/employer/jobs', requireEmployer, (req: AuthenticatedRequest, res) => {
    res.json(jobsService.getEmployerJobs(req.user!.sub));
  });

  api.post('/employer/jobs', requireEmployer, (req: AuthenticatedRequest, res) => {
    try {
      const job = jobsService.createJob(req.user!.sub, req.body);
      res.status(201).json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/employer/jobs/:id/applications', requireEmployer, (req: AuthenticatedRequest, res) => {
    try {
      const applications = applicationsService.getJobApplicationsForEmployer(
        req.user!.sub,
        req.params.id
      );
      res.json(applications);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  api.get('/employer/applications/:id', requireEmployer, (req: AuthenticatedRequest, res) => {
    try {
      const application = applicationsService.getEmployerApplicationById(
        req.user!.sub,
        req.params.id
      );
      res.json(application);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  api.patch('/employer/applications/:id/status', requireEmployer, (req: AuthenticatedRequest, res) => {
    try {
      const { status, note } = req.body;
      const updated = applicationsService.updateStatus(
        req.user!.sub,
        req.params.id,
        status,
        note
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Private Resume Access Control
  api.get('/resumes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const access = applicationsService.getResumeAccess(
        req.user!.sub,
        req.user!.role,
        req.params.id
      );
      res.json(access);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  app.use('/api/v1', api);
  return app;
}
