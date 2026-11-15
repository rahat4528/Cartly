import { initialJobBoardSeed } from '../../../database/seed.js';
import { v4 as uuidv4 } from 'uuid';

export class JobBoardStore {
  private static instance: JobBoardStore;

  users: any[] = [];
  companies: any[] = [];
  categories: any[] = [];
  jobs: any[] = [];
  resumes: any[] = [];
  applications: any[] = [];
  statusHistories: any[] = [];
  savedJobs: Map<string, Set<string>> = new Map(); // seekerId -> Set<jobId>
  interviews: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): JobBoardStore {
    if (!JobBoardStore.instance) {
      JobBoardStore.instance = new JobBoardStore();
    }
    return JobBoardStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialJobBoardSeed.users));
    this.companies = JSON.parse(JSON.stringify(initialJobBoardSeed.companies));
    this.categories = JSON.parse(JSON.stringify(initialJobBoardSeed.categories));
    this.jobs = JSON.parse(JSON.stringify(initialJobBoardSeed.jobs));
    this.resumes = [
      {
        id: "res_default_alex",
        seekerId: "usr_seeker_1",
        fileName: "Alex_Mercer_Distributed_Systems_Resume.pdf",
        fileUrl: "https://storage.cartly.local/resumes/usr_seeker_1/resume.pdf",
        parsedKeywords: ["Go", "Distributed Systems", "Kubernetes", "PostgreSQL", "Redis", "TypeScript"],
        uploadedAt: new Date().toISOString()
      }
    ];
    this.applications = [];
    this.statusHistories = [];
    this.savedJobs.clear();
    this.interviews = [];
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findCompany(id: string) {
    return this.companies.find(c => c.id === id || c.slug === id);
  }

  findJob(id: string) {
    return this.jobs.find(j => j.id === id || j.slug === id);
  }

  findResume(id: string) {
    return this.resumes.find(r => r.id === id);
  }
}
