import { initialHotelSeed } from '../../../database/seed.js';

export interface NightlyCost {
  date: string;
  baseRate: number;
  seasonMultiplier: number;
  seasonName: string;
  isWeekend: boolean;
  weekendMultiplier: number;
  nightlyTotal: number;
}

export interface ReservationRecord {
  id: string;
  voucherCode: string;
  hotelId: string;
  roomTypeId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nightsCount: number;
  roomsCount: number;
  status: 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  nightlyBreakdown: NightlyCost[];
  subtotal: number;
  taxAmount: number;
  feesAmount: number;
  totalAmount: number;
  expiresAt: string; // ISO
  paidAt?: string;
  cancelledAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export class HotelStore {
  private static instance: HotelStore;

  users: any[] = [];
  hotels: any[] = [];
  roomTypes: any[] = [];
  seasonalRules: any[] = [];
  reservations: ReservationRecord[] = [];
  paymentRecords: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): HotelStore {
    if (!HotelStore.instance) {
      HotelStore.instance = new HotelStore();
    }
    return HotelStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialHotelSeed.users));
    this.hotels = JSON.parse(JSON.stringify(initialHotelSeed.hotels));
    this.roomTypes = JSON.parse(JSON.stringify(initialHotelSeed.roomTypes));
    this.seasonalRules = JSON.parse(JSON.stringify(initialHotelSeed.seasonalRules));
    this.reservations = [];
    this.paymentRecords = [];
  }

  findHotel(idOrSlug: string) {
    return this.hotels.find(h => h.id === idOrSlug || h.slug === idOrSlug);
  }

  findRoomType(id: string) {
    return this.roomTypes.find(r => r.id === id);
  }

  findReservation(idOrVoucher: string) {
    return this.reservations.find(r => r.id === idOrVoucher || r.voucherCode === idOrVoucher);
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // Auto-prune holds that have timed out
  cleanupExpiredHolds(): void {
    const now = new Date();
    for (const r of this.reservations) {
      if (r.status === 'HELD' && new Date(r.expiresAt) <= now) {
        r.status = 'EXPIRED';
        r.updatedAt = now.toISOString();
      }
    }
  }
}
