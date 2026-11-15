const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'PATRON' | 'USHER' | 'ADMIN';
  phone?: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  rating: string;
  runtimeMinutes: number;
  genre: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  showtimes?: Showtime[];
}

export interface Showtime {
  id: string;
  movieId: string;
  auditoriumId: string;
  startTime: string;
  format: 'STANDARD_2D' | 'IMAX_3D' | 'DOLBY_ATMOS' | 'FOUR_DX';
  basePrice: number;
  auditorium?: {
    id: string;
    name: string;
    totalRows: number;
    totalCols: number;
  };
}

export interface SeatInfo {
  row: string;
  col: number;
  label: string;
  tier: 'STANDARD' | 'PREMIUM' | 'VIP_RECLINER';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
}

export interface SeatMatrixResponse {
  showtime: Showtime;
  movie: Movie;
  auditorium: {
    id: string;
    name: string;
    totalRows: number;
    totalCols: number;
  };
  rows: string[];
  cols: number[];
  seats: SeatInfo[];
  pricingTiers: {
    tier: string;
    price: number;
  }[];
}

export interface Booking {
  id: string;
  bookingRef: string;
  ticketCode: string;
  showtimeId: string;
  guestId: string;
  seats: string[];
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
  status: 'HELD' | 'CONFIRMED' | 'ADMITTED' | 'CANCELLED' | 'EXPIRED';
  holdExpiresAt?: string;
  confirmedAt?: string;
  admittedAt?: string;
  admittedBy?: string;
  movie?: Movie;
  showtime?: Showtime;
  auditorium?: {
    id: string;
    name: string;
  };
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
