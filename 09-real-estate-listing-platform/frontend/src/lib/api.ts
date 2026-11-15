const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'REAL_ESTATE_AGENT' | 'PLATFORM_ADMIN';
  phone?: string;
  agencyName?: string;
  licenseNo?: string;
}

export interface PriceHistoryItem {
  id: string;
  date: string;
  previousPrice: number;
  newPrice: number;
  priceChangeAmount: number;
  priceChangePercent: number;
  reason: string;
}

export interface Property {
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
  distanceKm?: number;
  priceHistory: PriceHistoryItem[];
  agent?: User;
}

export interface Tour {
  id: string;
  propertyId: string;
  userId: string;
  tourDate: string;
  tourTime: string;
  tourType: 'IN_PERSON' | 'VIRTUAL_WALKTHROUGH';
  notes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  property?: Property;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `HTTP error ${res.status}`);
  }

  return data as T;
}
