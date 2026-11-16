const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5011/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  avatarUrl?: string;
}

export interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  nightlyRate: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
}

export interface PriceBreakdown {
  nightlyRate: number;
  nightsCount: number;
  baseSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  occupancyTax: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  guestCount: number;
  nightlyRate: number;
  baseSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  occupancyTax: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  holdExpiresAt?: string;
  confirmedAt?: string;
  listingTitle?: string;
}

export interface Review {
  id: string;
  listingId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}
