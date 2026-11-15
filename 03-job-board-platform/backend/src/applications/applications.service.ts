import { JobBoardStore } from '../database/store.js';
import { ApplicationStateMachine, ApplicationStatus } from './state-machine.js';
import { SkillMatchingEngine } from '../matching/skill-matching.js';
import { v4 as uuidv4 } from 'uuid';

export class ApplicationsService {
  private store = JobBoardStore.getInstance();

  apply(
    seekerId: string,
    jobId: string,
    resumeId?: string,
    coverNote?: string,
    candidateSkills?: string[],
    resumeUrl?: string
  ) {
    const job = this.store.findJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (!job.isPublished) {
      throw new Error('This job listing is unpublished and cannot receive applications.');
    }

    const now = new Date();
    if (new Date(job.expiresAt) < now) {
      throw new Error('This job listing has expired and is no longer accepting applications.');
    }

    // Rule 1: Duplicate application check
    const existing = this.store.applications.find(a => a.jobId === job.id && a.seekerId === seekerId);
    if (existing) {
      throw new Error('Duplicate application: You have already applied for this position.');
    }

    let resume = resumeId ? this.store.findResume(resumeId) : null;
    if (!resume || resume.seekerId !== seekerId) {
      resume = {
        id: `res_${uuidv4().substring(0, 8)}`,
        seekerId,
        fileName: 'Candidate_Resume.pdf',
        fileUrl: resumeUrl || 'https://storage.cartly.local/resumes/default.pdf',
        parsedKeywords: candidateSkills || ['TypeScript', 'JavaScript'],
        uploadedAt: new Date().toISOString()
      };
      this.store.resumes.push(resume);
    }

    const seeker = this.store.findUser(seekerId);
    const skillsToMatch = candidateSkills || seeker?.skills || resume.parsedKeywords || [];
    const match = SkillMatchingEngine.evaluate(skillsToMatch, job.requiredSkills || []);

    const application = {
      id: `app_${uuidv4().substring(0, 8)}`,
      jobId: job.id,
      jobTitle: job.title,
      companyId: job.companyId,
      seekerId,
      seekerName: seeker?.name || 'Applicant',
      seekerEmail: seeker?.email || '',
      resumeId: resume.id,
      resumeFileName: resume.fileName,
      resumeUrl: resume.fileUrl,
      coverNote: coverNote || null,
      status: 'APPLIED' as ApplicationStatus,
      matchScore: match.matchScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      engineType: match.engineType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.applications.push(application);

    // Initial status history
    this.store.statusHistories.push({
      id: `hist_${uuidv4().substring(0, 8)}`,
      applicationId: application.id,
      fromStatus: null,
      toStatus: 'APPLIED',
      changedBy: seeker?.name || 'Candidate',
      note: 'Application submitted',
      timestamp: new Date().toISOString()
    });

    return application;
  }

  getSeekerApplications(seekerId: string) {
    return this.store.applications
      .filter(a => a.seekerId === seekerId)
      .map(a => {
        const company = this.store.findCompany(a.companyId);
        const history = this.store.statusHistories.filter(h => h.applicationId === a.id);
        return {
          ...a,
          companyName: company?.name || 'Company',
          companyLogo: company?.logoUrl || '',
          history
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Employer ATS Pipeline View (Guarantees Cross-Employer Isolation!)
  getJobApplicationsForEmployer(employerUserId: string, jobId: string) {
    const employer = this.store.users.find(u => u.id === employerUserId && u.role === 'EMPLOYER');
    if (!employer) {
      throw new Error('Unauthorized: Employer credentials required.');
    }

    const job = this.store.findJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    // Cross-employer isolation: verify this employer owns the company listing
    if (job.companyId !== employer.companyId) {
      throw new Error('Forbidden: An employer cannot access applicants for jobs owned by another company.');
    }

    return this.store.applications
      .filter(a => a.jobId === job.id)
      .map(a => {
        const history = this.store.statusHistories.filter(h => h.applicationId === a.id);
        return {
          ...a,
          history
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  getEmployerApplicationById(employerUserId: string, applicationId: string) {
    const employer = this.store.users.find(u => u.id === employerUserId && u.role === 'EMPLOYER');
    if (!employer) {
      throw new Error('Unauthorized: Employer credentials required.');
    }

    const application = this.store.applications.find(a => a.id === applicationId);
    if (!application) throw new Error(`Application ${applicationId} not found`);

    if (application.companyId !== employer.companyId) {
      throw new Error('Forbidden: An employer cannot access applicants for jobs owned by another company.');
    }

    const history = this.store.statusHistories.filter(h => h.applicationId === application.id);
    const resume = this.store.findResume(application.resumeId);

    return {
      ...application,
      statusHistory: history,
      resumeUrl: resume?.fileUrl || application.resumeUrl
    };
  }

  updateStatus(employerUserId: string, applicationId: string, nextStatus: ApplicationStatus, note?: string) {
    const employer = this.store.users.find(u => u.id === employerUserId && u.role === 'EMPLOYER');
    if (!employer) {
      throw new Error('Unauthorized: Employer credentials required.');
    }

    const application = this.store.applications.find(a => a.id === applicationId);
    if (!application) throw new Error(`Application ${applicationId} not found`);

    if (application.companyId !== employer.companyId) {
      throw new Error('Forbidden: You cannot modify applicants for another company.');
    }

    // Validate state machine
    ApplicationStateMachine.validate(application.status, nextStatus);

    const prevStatus = application.status;
    application.status = nextStatus;
    application.updatedAt = new Date().toISOString();

    this.store.statusHistories.push({
      id: `hist_${uuidv4().substring(0, 8)}`,
      applicationId: application.id,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      changedBy: employer.name,
      note: note || `Status transitioned to ${nextStatus}`,
      timestamp: new Date().toISOString()
    });

    return application;
  }

  // Resume Access Control
  getResumeAccess(userId: string, userRole: string, resumeId: string) {
    const resume = this.store.findResume(resumeId);
    if (!resume) throw new Error('Resume not found');

    // Case 1: Candidate is the owner
    if (resume.seekerId === userId) {
      return { authorized: true, resume, accessType: 'OWNER' };
    }

    // Case 2: Employer who received an application from this candidate
    if (userRole === 'EMPLOYER') {
      const employer = this.store.findUser(userId);
      const applicationWithResume = this.store.applications.find(
        a => a.resumeId === resumeId && a.companyId === employer?.companyId
      );

      if (applicationWithResume) {
        return { authorized: true, resume, accessType: 'EMPLOYER_APPLICATION' };
      }
    }

    // Otherwise access is strictly forbidden
    throw new Error('Access Denied: Private candidate resumes can only be inspected by the owner or authorized employer.');
  }
}
