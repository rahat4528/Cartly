import { JobBoardStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export interface JobQueryOptions {
  query?: string;
  categoryId?: string;
  jobType?: string;
  location?: string;
  minSalary?: number;
  sort?: 'newest' | 'salary_desc';
  page?: number;
  limit?: number;
}

export class JobsService {
  private store = JobBoardStore.getInstance();

  getJobs(options: JobQueryOptions = {}) {
    const {
      query,
      categoryId,
      jobType,
      location,
      minSalary,
      sort = 'newest',
      page = 1,
      limit = 10
    } = options;

    const now = new Date();
    // Only return published and active (non-expired) jobs in public catalog
    let results = this.store.jobs
      .filter(j => j.isPublished && new Date(j.expiresAt) > now)
      .map(j => this.enrichJob(j));

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.company.name.toLowerCase().includes(q) ||
        (j.requiredSkills && j.requiredSkills.some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    if (categoryId) {
      results = results.filter(j => j.categoryId === categoryId);
    }

    if (jobType) {
      results = results.filter(j => j.jobType.toUpperCase() === jobType.toUpperCase());
    }

    if (location) {
      const l = location.toLowerCase();
      results = results.filter(j => j.location.toLowerCase().includes(l));
    }

    if (minSalary !== undefined) {
      results = results.filter(j => j.maxSalary >= minSalary);
    }

    if (sort === 'salary_desc') {
      results.sort((a, b) => b.maxSalary - a.maxSalary);
    } else {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const totalCount = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      jobs: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  getJobByIdOrSlug(idOrSlug: string) {
    const job = this.store.jobs.find(j => j.id === idOrSlug || j.slug === idOrSlug);
    if (!job) return null;
    return this.enrichJob(job);
  }

  getCategories() {
    return this.store.categories.map(c => {
      const count = this.store.jobs.filter(j => j.categoryId === c.id && j.isPublished).length;
      return { ...c, jobCount: count };
    });
  }

  // Employer Job Posting
  createJob(employerUserId: string, params: any) {
    const employer = this.store.findUser(employerUserId);
    if (!employer || employer.role !== 'EMPLOYER') {
      throw new Error('Unauthorized: Employer account required.');
    }

    const jobId = `job_${uuidv4().substring(0, 8)}`;
    const slug = `${params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().substring(0, 4)}`;

    const newJob = {
      id: jobId,
      companyId: employer.companyId,
      categoryId: params.categoryId,
      title: params.title,
      slug,
      description: params.description,
      jobType: params.jobType || 'FULL_TIME',
      location: params.location,
      minSalary: Number(params.minSalary),
      maxSalary: Number(params.maxSalary),
      requiredSkills: params.requiredSkills || [],
      isPublished: true,
      expiresAt: params.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.jobs.push(newJob);
    return this.enrichJob(newJob);
  }

  getEmployerJobs(employerUserId: string) {
    const employer = this.store.findUser(employerUserId);
    if (!employer) return [];

    return this.store.jobs
      .filter(j => j.companyId === employer.companyId)
      .map(j => {
        const applications = this.store.applications.filter(a => a.jobId === j.id);
        return {
          ...this.enrichJob(j),
          applicantCount: applications.length
        };
      });
  }

  private enrichJob(job: any) {
    const company = this.store.findCompany(job.companyId);
    const category = this.store.categories.find(c => c.id === job.categoryId);

    return {
      ...job,
      company: company || { name: 'Verified Employer', isVerified: true },
      category: category || { name: 'General' }
    };
  }
}
