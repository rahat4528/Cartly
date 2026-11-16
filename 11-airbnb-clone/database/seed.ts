export const initialUsers = [
  {
    id: 'user_host_1',
    email: 'host@cartlystays.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Julian Montgomery (Superhost)',
    role: 'HOST',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'user_guest_1',
    email: 'guest@example.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Maya Lin',
    role: 'GUEST',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'user_guest_2',
    email: 'alex@example.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Alex Thorne',
    role: 'GUEST',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
];

export const initialListings = [
  {
    id: 'list_coastal_haven',
    hostId: 'user_host_1',
    title: 'Modern Coastal Cliff Villa with Infinity Pool',
    description: 'Breathtaking ocean panoramic views perched atop Big Sur coastal cliffs with floor-to-ceiling glass walls, heated saltwater pool, and private path.',
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
    amenities: ['Ocean View', 'Infinity Pool', 'Fast Wifi', 'EV Charger', 'Indoor Fireplace', 'Chef Kitchen']
  },
  {
    id: 'list_alpine_lodge',
    hostId: 'user_host_1',
    title: 'A-Frame Glass Cedar Chalet near Lake Tahoe',
    description: 'Secluded timber retreat nestled in towering pines. Features cedar wood-burning sauna, wrap-around deck, hot tub, and ski-in/ski-out access.',
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
    amenities: ['Mountain View', 'Hot Tub', 'Sauna', 'Wood Fireplace', 'Dedicated Workspace', 'Ski Storage']
  }
];
