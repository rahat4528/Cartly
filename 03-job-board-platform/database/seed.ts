export interface JobBoardSeedData {
  users: any[];
  companies: any[];
  categories: any[];
  jobs: any[];
}

export const initialJobBoardSeed: JobBoardSeedData = {
  users: [
    {
      id: "usr_admin",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm",
      role: "ADMIN",
      name: "Victoria Sterling"
    },
    {
      id: "usr_employer_1",
      email: "employer@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a",
      role: "EMPLOYER",
      name: "David Chen",
      companyId: "comp_001",
      title: "VP of People & Talent"
    },
    {
      id: "usr_employer_2",
      email: "employer2@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a",
      role: "EMPLOYER",
      name: "Elena Rostova",
      companyId: "comp_002",
      title: "Head of Technical Recruitment"
    },
    {
      id: "usr_seeker_1",
      email: "candidate@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a",
      role: "JOB_SEEKER",
      name: "Alex Mercer",
      headline: "Senior Distributed Systems Engineer & Open Source Contributor",
      bio: "8+ years engineering fault-tolerant microservices, high-throughput message buses, and cloud-native Kubernetes clusters.",
      location: "San Francisco, CA (Remote Friendly)",
      desiredSalary: 185000,
      skills: ["TypeScript", "Node.js", "Go", "PostgreSQL", "Kubernetes", "Redis", "Distributed Systems"]
    }
  ],
  companies: [
    {
      id: "comp_001",
      name: "Nova Cloud Labs",
      slug: "nova-cloud-labs",
      website: "https://novacloud.io",
      logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80",
      description: "Pioneering decentralized infrastructure, zero-trust enterprise edge networks, and distributed observability tools.",
      headquarters: "San Francisco, CA",
      isVerified: true
    },
    {
      id: "comp_002",
      name: "Apex Autonomous Systems",
      slug: "apex-autonomous-systems",
      website: "https://apexsystems.ai",
      logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80",
      description: "Developing intelligent perception platforms and autonomous robotics orchestration for global supply chains.",
      headquarters: "Austin, TX",
      isVerified: true
    }
  ],
  categories: [
    { id: "cat_eng", name: "Software Engineering", slug: "software-engineering" },
    { id: "cat_devops", name: "DevOps & Cloud Infrastructure", slug: "devops-cloud" },
    { id: "cat_product", name: "Product & Design", slug: "product-design" },
    { id: "cat_security", name: "Cybersecurity & InfoSec", slug: "cybersecurity" }
  ],
  jobs: [
    {
      id: "job_001",
      companyId: "comp_001",
      categoryId: "cat_eng",
      title: "Staff Distributed Systems Engineer",
      slug: "staff-distributed-systems-engineer",
      description: "We are seeking a Staff Engineer to architect our next-generation geo-replicated data mesh. You will design consensus protocols, optimize connection pools, and mentor senior backend engineers.",
      jobType: "FULL_TIME",
      location: "Remote (Global)",
      minSalary: 190000,
      maxSalary: 235000,
      requiredSkills: ["Distributed Systems", "Go", "Kubernetes", "PostgreSQL", "Redis"],
      isPublished: true,
      expiresAt: "2028-12-31T23:59:59Z"
    },
    {
      id: "job_002",
      companyId: "comp_001",
      categoryId: "cat_devops",
      title: "Senior Site Reliability Engineer (SRE)",
      slug: "senior-site-reliability-engineer",
      description: "Own global platform availability and chaos engineering drills across multi-region Kubernetes deployments.",
      jobType: "REMOTE",
      location: "San Francisco, CA (or Remote)",
      minSalary: 165000,
      maxSalary: 195000,
      requiredSkills: ["Kubernetes", "Terraform", "Prometheus", "Go", "Docker"],
      isPublished: true,
      expiresAt: "2028-12-31T23:59:59Z"
    },
    {
      id: "job_003",
      companyId: "comp_002",
      categoryId: "cat_eng",
      title: "Lead Full-Stack Engineer (React & TypeScript)",
      slug: "lead-full-stack-engineer",
      description: "Lead the frontend architecture of our autonomous fleet command dashboard using Next.js, WebGL telemetry, and reactive state stores.",
      jobType: "HYBRID",
      location: "Austin, TX",
      minSalary: 160000,
      maxSalary: 190000,
      requiredSkills: ["TypeScript", "React", "Node.js", "Tailwind CSS", "WebSocket"],
      isPublished: true,
      expiresAt: "2028-12-31T23:59:59Z"
    },
    {
      id: "job_004",
      companyId: "comp_002",
      categoryId: "cat_eng",
      title: "Expired Engineering Role (Testing)",
      slug: "expired-engineering-role",
      description: "This listing has passed its expiration window to test application submission rejection.",
      jobType: "CONTRACT",
      location: "Remote",
      minSalary: 120000,
      maxSalary: 140000,
      requiredSkills: ["Python"],
      isPublished: true,
      expiresAt: "2020-01-01T00:00:00Z" // Expired for testing!
    }
  ]
};
