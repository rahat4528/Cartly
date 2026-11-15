import { initialMovieSeed } from '../../../database/seed.js';

export interface BookingRecord {
  id: string;
  ticketCode: string;
  showtimeId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  seatNumbers: string[];
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
  status: 'HELD' | 'CONFIRMED' | 'ADMITTED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string; // ISO
  paidAt?: string;
  admittedAt?: string;
  admittedByUsherId?: string;
  createdAt: string;
  updatedAt: string;
}

export class MovieStore {
  private static instance: MovieStore;

  users: any[] = [];
  movies: any[] = [];
  auditoriums: any[] = [];
  showtimes: any[] = [];
  bookings: BookingRecord[] = [];
  paymentRecords: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): MovieStore {
    if (!MovieStore.instance) {
      MovieStore.instance = new MovieStore();
    }
    return MovieStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialMovieSeed.users));
    this.movies = JSON.parse(JSON.stringify(initialMovieSeed.movies));
    this.auditoriums = JSON.parse(JSON.stringify(initialMovieSeed.auditoriums));
    this.showtimes = JSON.parse(JSON.stringify(initialMovieSeed.showtimes));
    this.bookings = [];
    this.paymentRecords = [];
  }

  findMovie(idOrSlug: string) {
    return this.movies.find(m => m.id === idOrSlug || m.slug === idOrSlug);
  }

  findShowtime(id: string) {
    return this.showtimes.find(s => s.id === id);
  }

  findAuditorium(id: string) {
    return this.auditoriums.find(a => a.id === id);
  }

  findBooking(idOrTicket: string) {
    return this.bookings.find(b => b.id === idOrTicket || b.ticketCode === idOrTicket);
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  cleanupExpiredHolds(): void {
    const now = new Date();
    for (const b of this.bookings) {
      if (b.status === 'HELD' && new Date(b.expiresAt) <= now) {
        b.status = 'EXPIRED';
        b.updatedAt = now.toISOString();
      }
    }
  }
}
