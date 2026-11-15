export const initialUsers = [
  {
    id: 'user_landlord_1',
    email: 'landlord@cartlyrentals.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Eleanor Vance (Apex Properties)',
    role: 'LANDLORD',
    phone: '+1 (415) 890-1122'
  },
  {
    id: 'user_tenant_1',
    email: 'tenant@example.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Marcus Chen',
    role: 'TENANT',
    phone: '+1 (415) 555-0199'
  },
  {
    id: 'user_tenant_2',
    email: 'sophia@example.com',
    passwordHash: '$2a$10$wT/0jZpL5jXfC5y0Z1p8quP9U6f8f5M6F1GzU9k2J5vFzQ6k4j3O6', // Pass123!
    name: 'Sophia Patel',
    role: 'TENANT',
    phone: '+1 (415) 555-0321'
  }
];

export const initialProperties = [
  {
    id: 'prop_mission_heights',
    title: 'Mission Heights Victorian Flats',
    description: 'Renovated Edwardian triplex with bay windows, hardwood floors, and shared landscaped courtyard.',
    address: '742 Valencia Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94110',
    landlordId: 'user_landlord_1',
    units: [
      {
        id: 'unit_mission_2a',
        unitNumber: 'Unit 2A',
        bedrooms: 2,
        bathrooms: 1.5,
        squareFeet: 1100,
        monthlyRent: 3800,
        depositAmount: 3800,
        isAvailable: true
      },
      {
        id: 'unit_mission_1b',
        unitNumber: 'Unit 1B (Garden Suite)',
        bedrooms: 1,
        bathrooms: 1.0,
        squareFeet: 750,
        monthlyRent: 2900,
        depositAmount: 2900,
        isAvailable: true
      }
    ]
  },
  {
    id: 'prop_pacific_terrace',
    title: 'Pacific Terrace Townhomes',
    description: 'Contemporary multi-level townhouses featuring private roof decks and attached tandem garages.',
    address: '2100 Pacific Avenue',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94109',
    landlordId: 'user_landlord_1',
    units: [
      {
        id: 'unit_pacific_th3',
        unitNumber: 'Townhome 3',
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 1850,
        monthlyRent: 6200,
        depositAmount: 6200,
        isAvailable: true
      }
    ]
  }
];
