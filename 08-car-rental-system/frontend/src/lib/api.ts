const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5008/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'RENTER' | 'FLEET_AGENT' | 'FLEET_MANAGER';
  phone?: string;
  license?: {
    licenseNumber: string;
    issuingState: string;
    expiryDate: string;
    status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  } | null;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'SEDAN' | 'SUV' | 'ELECTRIC' | 'LUXURY' | 'MINIVAN' | 'COMPACT';
  vin: string;
  licensePlate: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'ELECTRIC' | 'HYBRID';
  seats: number;
  dailyRate: number;
  imageUrl: string;
  features: string[];
  isAvailable: boolean;
  isAvailableForDates?: boolean;
}

export interface RentalQuote {
  totalDays: number;
  baseDailyRate: number;
  discountPct: number;
  effectiveDailyRate: number;
  baseRentalSubtotal: number;
  insuranceDailyRate: number;
  insuranceSubtotal: number;
  securityDeposit: number;
  tax: number;
  grandTotal: number;
}

export interface Rental {
  id: string;
  rentalNumber: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRateApplied: number;
  durationDiscountPct: number;
  baseRentalAmount: number;
  insuranceAmount: number;
  securityDepositAmount: number;
  totalCharged: number;
  depositRefunded: number;
  damageDeduction: number;
  status: 'RESERVED' | 'ACTIVE_RENTAL' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';
  vehicle?: Vehicle;
  inspection?: {
    pickupOdometer: number;
    returnOdometer?: number;
    pickupFuelLevel: string;
    returnFuelLevel?: string;
    damagesNotes?: string;
    damageFeeAssessed: number;
  };
  createdAt: string;
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
