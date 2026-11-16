const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5012/api/v1';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airlineName: string;
  aircraftModel: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  durationMinutes: number;
  economyCapacity: number;
  economyBooked: number;
  economyPrice: number;
  businessCapacity: number;
  businessBooked: number;
  businessPrice: number;
  isDemonstration: boolean;
}

export interface Itinerary {
  id: string;
  type: 'DIRECT' | 'CONNECTING';
  legs: Flight[];
  totalDurationMinutes: number;
  totalPrice: number;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  connectionMinutes?: number;
  layoverAirport?: string;
  isDemonstration: boolean;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  passportNumber: string;
  dateOfBirth: string;
  seatNumber?: string;
}

export interface Booking {
  id: string;
  pnrLocator: string;
  userId: string;
  flightId: string;
  cabinClass: 'ECONOMY' | 'BUSINESS';
  passengerCount: number;
  baseFare: number;
  carrierFees: number;
  aviationTaxes: number;
  totalAmount: number;
  status: 'SEARCHED' | 'PRICED' | 'HELD' | 'PAID' | 'TICKETED' | 'CANCELLED';
  seatNumbers: string[];
  passengers: Passenger[];
  isDemonstration: boolean;
  ticketUrl?: string;
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
