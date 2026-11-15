import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  createdAt: string;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'TOWNHOUSE' | 'CONDO' | 'STUDIO';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  securityDeposit: number;
  availableDate: string;
  minLeaseMonths: number;
  petPolicy: 'ALLOWED' | 'CATS_ONLY' | 'DOGS_ONLY' | 'NO_PETS';
  utilitiesIncluded: string[];
  amenities: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'OFF_MARKET';
  imageUrls: string[];
  createdAt: string;
}

export interface TenantApplication {
  id: string;
  propertyId: string;
  applicantId: string;
  monthlyIncome: number;
  creditScoreBracket: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  employmentStatus: string;
  employerName: string;
  documentMetadata: {
    idDocumentName: string;
    incomeProofName: string;
    verified: boolean;
  };
  proposedMoveInDate: string;
  proposedLeaseMonths: number;
  status: 'APPLICATION_SUBMITTED' | 'UNDER_REVIEW' | 'LEASE_OFFERED' | 'LEASE_SIGNED' | 'REJECTED';
  landlordNotes?: string;
  createdAt: string;
}

export interface ViewingAppointment {
  id: string;
  propertyId: string;
  tenantId: string;
  slotTime: string; // ISO string e.g. "2026-11-20T14:00:00.000Z"
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface LeaseAgreement {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  applicationId?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'DRAFT' | 'LEASE_OFFERED' | 'LEASE_SIGNED' | 'ACTIVE' | 'TERMINATED';
  signedAt?: string;
  termsAndConditions: string;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  leaseId: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'GENERAL';
  urgency: 'EMERGENCY' | 'HIGH' | 'STANDARD';
  status: 'OPEN' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED';
  photoUrl?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: 'PAID' | 'PENDING' | 'LATE';
  paymentMethod?: string;
  transactionRef?: string;
  receiptNumber?: string;
  createdAt: string;
}

// In-Memory Database store with deterministic state
export class RentalDatabaseStore {
  users: User[] = [];
  properties: Property[] = [];
  applications: TenantApplication[] = [];
  viewings: ViewingAppointment[] = [];
  leases: LeaseAgreement[] = [];
  tickets: MaintenanceTicket[] = [];
  payments: RentPayment[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const passwordHash = bcrypt.hashSync('Pass123!', 8);
    const adminHash = bcrypt.hashSync('AdminPass123!', 8);

    this.users = [
      {
        id: 'usr-tenant-01',
        email: 'tenant@example.com',
        passwordHash,
        fullName: 'Sarah Jenkins',
        phone: '555-019-2831',
        role: 'TENANT',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-tenant-02',
        email: 'tenant@cartly.local',
        passwordHash,
        fullName: 'Sarah Jenkins',
        phone: '555-019-2831',
        role: 'TENANT',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-landlord-01',
        email: 'landlord@example.com',
        passwordHash,
        fullName: 'Marcus Vance Properties',
        phone: '555-014-9920',
        role: 'LANDLORD',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-landlord-02',
        email: 'landlord@cartly.local',
        passwordHash,
        fullName: 'Marcus Vance Properties',
        phone: '555-014-9920',
        role: 'LANDLORD',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-admin-01',
        email: 'admin@example.com',
        passwordHash: adminHash,
        fullName: 'House Rental Administrator',
        phone: '555-010-0000',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-admin-02',
        email: 'admin@cartly.local',
        passwordHash: adminHash,
        fullName: 'House Rental Administrator',
        phone: '555-010-0000',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      }
    ];

    this.properties = [
      {
        id: 'prop-01',
        landlordId: 'usr-landlord-01',
        title: 'Modern Oakwood Townhome with Private Garden',
        description: 'Immaculately maintained 3-bedroom, 2.5-bath townhome featuring hardwood flooring, stainless steel appliances, solar heating, and private landscaped courtyard.',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        propertyType: 'TOWNHOUSE',
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 1850,
        monthlyRent: 2450,
        securityDeposit: 2450,
        availableDate: '2026-12-01',
        minLeaseMonths: 12,
        petPolicy: 'ALLOWED',
        utilitiesIncluded: ['Water', 'Trash Collection', 'Gardening'],
        amenities: ['Central AC', 'Attached 2-Car Garage', 'In-Unit Washer/Dryer', 'EV Charger', 'Dishwasher'],
        status: 'AVAILABLE',
        imageUrls: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-02',
        landlordId: 'usr-landlord-01',
        title: 'Skyline View Executive Studio',
        description: 'Luxury high-floor studio residence with panoramic city skyline views, floor-to-ceiling soundproof glass, quartz countertops, and concierge building amenities.',
        address: '100 Metro Tower Blvd, Apt 18B',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        propertyType: 'STUDIO',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 680,
        monthlyRent: 1750,
        securityDeposit: 1750,
        availableDate: '2026-11-25',
        minLeaseMonths: 6,
        petPolicy: 'CATS_ONLY',
        utilitiesIncluded: ['High-Speed Fiber Internet', 'Water', 'Gas'],
        amenities: ['Rooftop Pool', '24/7 Fitness Center', 'Doorman', 'Bike Storage', 'Smart Thermostat'],
        status: 'AVAILABLE',
        imageUrls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-03',
        landlordId: 'usr-landlord-01',
        title: 'Spacious Suburban Family House with Fenced Yard',
        description: 'Charming 4-bedroom single-family colonial home located on a peaceful cul-de-sac. Features remodeled chef kitchen, finished basement recreation room, and large deck.',
        address: '3814 Maple Leaf Court',
        city: 'Naperville',
        state: 'IL',
        zipCode: '60540',
        propertyType: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2750,
        monthlyRent: 3200,
        securityDeposit: 3200,
        availableDate: '2026-12-15',
        minLeaseMonths: 12,
        petPolicy: 'ALLOWED',
        utilitiesIncluded: [],
        amenities: ['Fenced Backyard', 'Fireplace', 'Finished Basement', 'Double Ovens', 'Storage Shed'],
        status: 'AVAILABLE',
        imageUrls: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-04',
        landlordId: 'usr-landlord-01',
        title: 'Riverside Contemporary 2-Bedroom Condo',
        description: 'Sun-drenched corner unit condominium overlooking the river walk. Features split floor plan, private balcony, walk-in closets, and reserved underground parking.',
        address: '520 River North Way, Unit 402',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60654',
        propertyType: 'CONDO',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1220,
        monthlyRent: 2800,
        securityDeposit: 2800,
        availableDate: '2026-11-15',
        minLeaseMonths: 12,
        petPolicy: 'NO_PETS',
        utilitiesIncluded: ['Water', 'Trash', 'Building Maintenance'],
        amenities: ['Balcony', 'Reserved Heated Garage', 'Storage Locker', 'Package Lockers'],
        status: 'OCCUPIED',
        imageUrls: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
        createdAt: new Date().toISOString()
      }
    ];

    // Seed active lease for prop-04 with Sarah Jenkins
    this.leases = [
      {
        id: 'lease-101',
        propertyId: 'prop-04',
        landlordId: 'usr-landlord-01',
        tenantId: 'usr-tenant-01',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        monthlyRent: 2800,
        securityDeposit: 2800,
        status: 'ACTIVE',
        signedAt: '2025-12-20T15:30:00.000Z',
        termsAndConditions: 'Standard 12-Month Residential Lease Agreement with Illinois tenant protection provisions.',
        createdAt: '2025-12-15T10:00:00.000Z'
      }
    ];

    // Seed maintenance tickets for active lease
    this.tickets = [
      {
        id: 'tkt-01',
        leaseId: 'lease-101',
        propertyId: 'prop-04',
        tenantId: 'usr-tenant-01',
        title: 'Kitchen faucet dripping slowly under cabinet',
        description: 'The cold water supply line elbow has a small water drop accumulating when the faucet is turned on.',
        category: 'PLUMBING',
        urgency: 'STANDARD',
        status: 'SCHEDULED',
        photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
        resolutionNotes: 'Plumber scheduled for Tuesday 10am',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];

    // Seed rent ledger payments
    this.payments = [
      {
        id: 'pay-01',
        leaseId: 'lease-101',
        tenantId: 'usr-tenant-01',
        amount: 2800,
        dueDate: '2026-10-01',
        paidAt: '2026-09-30T14:15:00.000Z',
        status: 'PAID',
        paymentMethod: 'SANDBOX_ACH',
        transactionRef: 'ACH-202610-00812',
        receiptNumber: 'RCPT-202610-101',
        createdAt: '2026-09-30T14:15:00.000Z'
      },
      {
        id: 'pay-02',
        leaseId: 'lease-101',
        tenantId: 'usr-tenant-01',
        amount: 2800,
        dueDate: '2026-11-01',
        paidAt: '2026-11-01T09:20:00.000Z',
        status: 'PAID',
        paymentMethod: 'SANDBOX_CARD',
        transactionRef: 'CARD-202611-00941',
        receiptNumber: 'RCPT-202611-102',
        createdAt: '2026-11-01T09:20:00.000Z'
      },
      {
        id: 'pay-03',
        leaseId: 'lease-101',
        tenantId: 'usr-tenant-01',
        amount: 2800,
        dueDate: '2026-12-01',
        status: 'PENDING',
        createdAt: '2026-11-15T00:00:00.000Z'
      }
    ];

    // Seed existing viewing
    this.viewings = [
      {
        id: 'view-01',
        propertyId: 'prop-01',
        tenantId: 'usr-tenant-01',
        slotTime: '2026-11-20T14:00:00.000Z',
        status: 'CONFIRMED',
        notes: 'Interested in early move-in date.',
        createdAt: new Date().toISOString()
      }
    ];

    // Seed existing application
    this.applications = [
      {
        id: 'app-01',
        propertyId: 'prop-01',
        applicantId: 'usr-tenant-01',
        monthlyIncome: 8500,
        creditScoreBracket: 'EXCELLENT',
        employmentStatus: 'FULL_TIME',
        employerName: 'BioHealth Research Labs',
        documentMetadata: {
          idDocumentName: 'sarah_jenkins_license_verified.pdf',
          incomeProofName: 'sarah_w2_paystub_oct2026.pdf',
          verified: true
        },
        proposedMoveInDate: '2026-12-01',
        proposedLeaseMonths: 12,
        status: 'UNDER_REVIEW',
        landlordNotes: 'Income exceeds 3x rent ratio. Credit bracket verified.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  }
}

export const store = new RentalDatabaseStore();
