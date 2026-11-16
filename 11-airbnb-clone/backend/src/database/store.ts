import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
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
  cancelledAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  listingId: string;
  guestId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export class AirbnbStore {
  private static instance: AirbnbStore;

  users: User[] = [];
  listings: Listing[] = [];
  bookings: Booking[] = [];
  reviews: Review[] = [];

  constructor() {
    this.seed();
  }

  static getInstance(): AirbnbStore {
    if (!AirbnbStore.instance) {
      AirbnbStore.instance = new AirbnbStore();
    }
    return AirbnbStore.instance;
  }

  resetToSeed(): void {
    this.seed();
  }

  seed(): void {
    const passwordHash = bcrypt.hashSync('Pass123!', 8);
    const adminHash = bcrypt.hashSync('AdminPass123!', 8);

    this.users = [
      {
        id: 'user_host_1',
        email: 'host@cartlystays.com',
        passwordHash,
        name: 'Julian Montgomery (Superhost)',
        role: 'HOST',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_host_1',
        email: 'host@example.com',
        passwordHash,
        name: 'Julian Montgomery (Superhost)',
        role: 'HOST',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_guest_1',
        email: 'guest@example.com',
        passwordHash,
        name: 'Maya Lin',
        role: 'GUEST',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_guest_2',
        email: 'alex@example.com',
        passwordHash,
        name: 'Alex Thorne',
        role: 'GUEST',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_admin_1',
        email: 'admin@example.com',
        passwordHash: adminHash,
        name: 'Accommodation Platform Administrator',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      }
    ];

    this.listings = [
      {
        id: 'list_coastal_haven',
        hostId: 'user_host_1',
        title: 'Modern Coastal Cliff Villa with Infinity Pool',
        description: 'Breathtaking ocean panoramic views perched atop Big Sur coastal cliffs with floor-to-ceiling glass walls, heated saltwater pool, and private scenic path.',
        category: 'Beachfront',
        location: 'Big Sur, California, United States',
        city: 'Big Sur',
        country: 'United States',
        latitude: 36.2704,
        longitude: -121.8081,
        nightlyRate: 480,
        cleaningFee: 150,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2.0,
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Ocean View', 'Infinity Pool', 'Fast Wifi', 'EV Charger', 'Indoor Fireplace', 'Chef Kitchen'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'list_alpine_lodge',
        hostId: 'user_host_1',
        title: 'A-Frame Glass Cedar Chalet near Lake Tahoe',
        description: 'Secluded timber retreat nestled in towering pines. Features cedar wood-burning sauna, wrap-around deck, hot tub, and ski trail access.',
        category: 'Cabins',
        location: 'Truckee, California, United States',
        city: 'Truckee',
        country: 'United States',
        latitude: 39.3279,
        longitude: -120.1833,
        nightlyRate: 320,
        cleaningFee: 120,
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2.5,
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Mountain View', 'Hot Tub', 'Sauna', 'Wood Fireplace', 'Dedicated Workspace', 'Ski Storage'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'list_skyline_penthouse',
        hostId: 'user_host_1',
        title: 'Architectural Skyline Penthouse with Terrace',
        description: 'Spectacular penthouse loft in downtown arts district with private rooftop garden, 14-foot exposed beam ceilings, and designer furniture.',
        category: 'Iconic Cities',
        location: 'New York, New York, United States',
        city: 'New York',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.0060,
        nightlyRate: 550,
        cleaningFee: 180,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2.0,
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Skyline View', 'Rooftop Terrace', 'Smart Home', 'Espresso Bar', 'Elevator', 'Gym Access'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Pre-seed confirmed booking on coastal haven for Dec 20 - 25, 2026
    this.bookings = [
      {
        id: 'book_seed_coastal',
        listingId: 'list_coastal_haven',
        guestId: 'user_guest_2',
        checkIn: '2026-12-20',
        checkOut: '2026-12-25',
        nightsCount: 5,
        guestCount: 2,
        nightlyRate: 480,
        baseSubtotal: 2400,
        cleaningFee: 150,
        serviceFee: 288,
        occupancyTax: 255,
        totalPrice: 3093,
        status: 'CONFIRMED',
        confirmedAt: '2026-10-01T12:00:00.000Z',
        createdAt: '2026-10-01T11:50:00.000Z',
        updatedAt: '2026-10-01T12:00:00.000Z'
      },
      {
        id: 'book_past_completed_01',
        listingId: 'list_alpine_lodge',
        guestId: 'user_guest_1',
        checkIn: '2026-10-01',
        checkOut: '2026-10-05',
        nightsCount: 4,
        guestCount: 2,
        nightlyRate: 320,
        baseSubtotal: 1280,
        cleaningFee: 120,
        serviceFee: 154,
        occupancyTax: 140,
        totalPrice: 1694,
        status: 'COMPLETED',
        confirmedAt: '2026-09-20T10:00:00.000Z',
        createdAt: '2026-09-20T09:50:00.000Z',
        updatedAt: '2026-10-05T12:00:00.000Z'
      }
    ];

    this.reviews = [
      {
        id: 'rev_01',
        listingId: 'list_alpine_lodge',
        guestId: 'user_guest_1',
        guestName: 'Maya Lin',
        rating: 5,
        comment: 'Unbelievable mountain views and the private sauna was exceptional after a day of hiking! Highly recommended.',
        createdAt: '2026-10-06T14:20:00.000Z'
      }
    ];
  }

  sweepExpiredHolds(): number {
    const now = Date.now();
    let expiredCount = 0;
    for (const b of this.bookings) {
      if (b.status === 'PENDING' && b.holdExpiresAt) {
        if (new Date(b.holdExpiresAt).getTime() < now) {
          b.status = 'EXPIRED';
          expiredCount++;
        }
      }
    }
    return expiredCount;
  }
}

export const store = AirbnbStore.getInstance();
