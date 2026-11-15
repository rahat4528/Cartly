import { initialRestaurantSeed } from '../../../database/seed.js';

export interface ReservationRecord {
  id: string;
  reservationCode: string;
  restaurantId: string;
  tableIds: string[];
  tableNumbers: string[];
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  reservationDate: string; // YYYY-MM-DD
  timeSlot: string;        // HH:mm (e.g. 19:00)
  partySize: number;
  seatingZone: string;     // INDOOR_MAIN, PATIO_TERRACE, BAR_HIGHTOP, CHEFS_COUNTER
  specialRequests?: string;
  status: 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'WAITLIST' | 'PROMOTED';
  durationMinutes: number;
  turnoverBufferMinutes: number;
  promotedUntil?: string;  // ISO timestamp for 15-minute waitlist claim
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistRecord {
  id: string;
  restaurantId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  reservationDate: string;
  preferredTimeSlot: string;
  partySize: number;
  seatingZone: string;
  priorityIndex: number;
  status: 'WAITLIST' | 'PROMOTED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  promotedReservationId?: string;
  promotedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export class RestaurantStore {
  private static instance: RestaurantStore;

  users: any[] = [];
  restaurants: any[] = [];
  diningTables: any[] = [];
  reservations: ReservationRecord[] = [];
  waitlistEntries: WaitlistRecord[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): RestaurantStore {
    if (!RestaurantStore.instance) {
      RestaurantStore.instance = new RestaurantStore();
    }
    return RestaurantStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialRestaurantSeed.users));
    this.restaurants = JSON.parse(JSON.stringify(initialRestaurantSeed.restaurants));
    this.diningTables = JSON.parse(JSON.stringify(initialRestaurantSeed.diningTables));
    this.reservations = [];
    this.waitlistEntries = [];
  }

  findRestaurant(idOrSlug: string) {
    return this.restaurants.find(r => r.id === idOrSlug || r.slug === idOrSlug);
  }

  findTable(id: string) {
    return this.diningTables.find(t => t.id === id);
  }

  findReservation(idOrCode: string) {
    return this.reservations.find(r => r.id === idOrCode || r.reservationCode === idOrCode);
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
}
