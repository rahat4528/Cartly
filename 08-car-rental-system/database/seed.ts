export const initialCarRentalSeed = {
  users: [
    {
      id: "usr_renter_01",
      email: "renter@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Ethan Wright",
      phone: "+1 (555) 432-8765",
      role: "RENTER",
      license: {
        licenseNumber: "DL-98472910-CA",
        issuingState: "California",
        expiryDate: "2029-08-15",
        status: "VERIFIED"
      }
    },
    {
      id: "usr_renter_02",
      email: "renter@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Ethan Wright",
      phone: "+1 (555) 432-8765",
      role: "RENTER",
      license: {
        licenseNumber: "DL-98472910-CA",
        issuingState: "California",
        expiryDate: "2029-08-15",
        status: "VERIFIED"
      }
    },
    {
      id: "usr_agent_01",
      email: "agent@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Chloe Bennett (Fleet Return Inspector)",
      phone: "+1 (555) 876-5432",
      role: "FLEET_AGENT"
    },
    {
      id: "usr_agent_02",
      email: "agent@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Chloe Bennett (Fleet Return Inspector)",
      phone: "+1 (555) 876-5432",
      role: "FLEET_AGENT"
    },
    {
      id: "usr_admin_01",
      email: "admin@example.com",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Fleet Operations Executive",
      phone: "+1 (555) 999-1111",
      role: "FLEET_MANAGER"
    },
    {
      id: "usr_admin_02",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Fleet Operations Executive",
      phone: "+1 (555) 999-1111",
      role: "FLEET_MANAGER"
    }
  ],
  vehicles: [
    {
      id: "veh_001",
      make: "Tesla",
      model: "Model 3 Long Range AWD",
      year: 2024,
      category: "ELECTRIC",
      vin: "5YJ3E1EB7NF112233",
      licensePlate: "8XYZ901",
      transmission: "AUTOMATIC",
      fuelType: "ELECTRIC",
      seats: 5,
      dailyRate: 89.00,
      imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
      features: ["Autopilot", "358mi Range", "Glass Panoramic Roof", "Premium Audio"],
      isAvailable: true
    },
    {
      id: "veh_002",
      make: "BMW",
      model: "530i M Sport",
      year: 2024,
      category: "LUXURY",
      vin: "WBA53BJ01RC445566",
      licensePlate: "7ABC456",
      transmission: "AUTOMATIC",
      fuelType: "GASOLINE",
      seats: 5,
      dailyRate: 119.00,
      imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
      features: ["Leather Upholstery", "Navigation HUD", "Harman Kardon", "Heated Seats"],
      isAvailable: true
    },
    {
      id: "veh_003",
      make: "Toyota",
      model: "RAV4 Hybrid XSE AWD",
      year: 2024,
      category: "SUV",
      vin: "2T3P1RFV5RC778899",
      licensePlate: "9KLM234",
      transmission: "AUTOMATIC",
      fuelType: "HYBRID",
      seats: 5,
      dailyRate: 69.00,
      imageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      features: ["40 MPG Combined", "Apple CarPlay", "Roof Rails", "Lane Tracing"],
      isAvailable: true
    },
    {
      id: "veh_004",
      make: "Porsche",
      model: "911 Carrera GTS",
      year: 2023,
      category: "LUXURY",
      vin: "WP0AB2A97NS990011",
      licensePlate: "3PRS911",
      transmission: "AUTOMATIC",
      fuelType: "GASOLINE",
      seats: 4,
      dailyRate: 249.00,
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      features: ["Sport Chrono", "Bose Surround", "Twin-Turbo 473HP", "Adaptive Suspension"],
      isAvailable: true
    },
    {
      id: "veh_005",
      make: "Honda",
      model: "Civic Touring",
      year: 2024,
      category: "COMPACT",
      vin: "1HGCV1F12NA554433",
      licensePlate: "5QRS789",
      transmission: "AUTOMATIC",
      fuelType: "GASOLINE",
      seats: 5,
      dailyRate: 49.00,
      imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
      features: ["Wireless Charging", "Honda Sensing", "Bose Sound", "38 MPG"],
      isAvailable: true
    }
  ],
  rentals: [
    {
      id: "rnt_preseed_01",
      rentalNumber: "RNT-2026-8801",
      userId: "usr_renter_01",
      vehicleId: "veh_001",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      totalDays: 4,
      dailyRateApplied: 89.00,
      durationDiscountPct: 0.0,
      baseRentalAmount: 356.00,
      insuranceAmount: 79.96,
      securityDepositAmount: 250.00,
      totalCharged: 685.96,
      depositRefunded: 0.0,
      damageDeduction: 0.0,
      status: "RESERVED",
      createdAt: "2026-11-15T10:00:00.000Z"
    }
  ]
};
