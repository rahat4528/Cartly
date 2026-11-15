import { initialRealEstateSeed } from '../../../database/seed.js';

export interface PriceHistoryRecord {
  id: string;
  date: string;
  previousPrice: number;
  newPrice: number;
  priceChangeAmount: number;
  priceChangePercent: number;
  reason: string;
}

export interface PropertyRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: 'SINGLE_FAMILY' | 'CONDO' | 'TOWNHOUSE' | 'MULTI_FAMILY' | 'COMMERCIAL';
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  hoaFee: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  images: string[];
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'UNDER_CONTRACT' | 'SOLD' | 'DELISTED';
  agentId: string;
  priceHistory: PriceHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface TourRecord {
  id: string;
  propertyId: string;
  userId: string;
  tourDate: string; // YYYY-MM-DD
  tourTime: string; // "14:00"
  tourType: 'IN_PERSON' | 'VIRTUAL_WALKTHROUGH';
  notes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export class RealEstateStore {
  private static instance: RealEstateStore;

  users: any[] = [];
  properties: PropertyRecord[] = [];
  tours: TourRecord[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): RealEstateStore {
    if (!RealEstateStore.instance) {
      RealEstateStore.instance = new RealEstateStore();
    }
    return RealEstateStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialRealEstateSeed.users));
    this.properties = JSON.parse(JSON.stringify(initialRealEstateSeed.properties));
    this.tours = [];
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findProperty(idOrSlug: string) {
    return this.properties.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  }
}
