export const initialUsers = [
  {
    id: 'user_passenger_1',
    email: 'passenger@example.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'David Sterling',
    role: 'PASSENGER'
  },
  {
    id: 'user_admin_1',
    email: 'admin@cartlyairways.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Chief Operations Officer',
    role: 'ADMIN'
  }
];

export const initialAirports = [
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', latitude: 37.6213, longitude: -122.3790 },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', latitude: 40.6413, longitude: -73.7781 },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', latitude: 41.9742, longitude: -87.9073 },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', latitude: 51.4700, longitude: -0.4543 },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', latitude: 35.5494, longitude: 139.7798 }
];

export const initialFlights = [
  {
    id: 'flt_sfo_jfk_01',
    flightNumber: 'CA-102',
    airlineName: 'Cartly Airways',
    aircraftModel: 'Boeing 787-9 Dreamliner',
    originCode: 'SFO',
    destinationCode: 'JFK',
    departureDate: '2026-12-15',
    departureTime: '08:30',
    arrivalDate: '2026-12-15',
    arrivalTime: '17:05',
    durationMinutes: 335,
    economyCapacity: 200,
    economyBooked: 2,
    economyPrice: 289,
    businessCapacity: 30,
    businessBooked: 0,
    businessPrice: 850,
    isDemonstration: true
  },
  {
    id: 'flt_sfo_ord_01',
    flightNumber: 'CA-305',
    airlineName: 'Cartly Airways',
    aircraftModel: 'Airbus A321neo',
    originCode: 'SFO',
    destinationCode: 'ORD',
    departureDate: '2026-12-15',
    departureTime: '07:00',
    arrivalDate: '2026-12-15',
    arrivalTime: '13:15',
    durationMinutes: 255,
    economyCapacity: 160,
    economyBooked: 0,
    economyPrice: 195,
    businessCapacity: 16,
    businessBooked: 0,
    businessPrice: 550,
    isDemonstration: true
  },
  {
    id: 'flt_ord_jfk_01',
    flightNumber: 'CA-306',
    airlineName: 'Cartly Airways',
    aircraftModel: 'Boeing 737-MAX 9',
    originCode: 'ORD',
    destinationCode: 'JFK',
    departureDate: '2026-12-15',
    departureTime: '15:00', // 1h45m after arrival in ORD (valid connection)
    arrivalDate: '2026-12-15',
    arrivalTime: '18:20',
    durationMinutes: 140,
    economyCapacity: 170,
    economyBooked: 0,
    economyPrice: 145,
    businessCapacity: 12,
    businessBooked: 0,
    businessPrice: 390,
    isDemonstration: true
  },
  {
    id: 'flt_jfk_lhr_01',
    flightNumber: 'CA-001',
    airlineName: 'Cartly Airways',
    aircraftModel: 'Airbus A350-1000',
    originCode: 'JFK',
    destinationCode: 'LHR',
    departureDate: '2026-12-16',
    departureTime: '21:00',
    arrivalDate: '2026-12-17',
    arrivalTime: '09:15',
    durationMinutes: 435,
    economyCapacity: 250,
    economyBooked: 0,
    economyPrice: 580,
    businessCapacity: 44,
    businessBooked: 0,
    businessPrice: 1850,
    isDemonstration: true
  }
];
