export const initialHotelSeed = {
  users: [
    {
      id: "usr_guest_01",
      email: "guest@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Elena Rostova",
      phone: "+1 (555) 234-5678",
      role: "GUEST"
    },
    {
      id: "usr_hotelier_01",
      email: "hotelier@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Marcus Vance",
      phone: "+1 (555) 876-5432",
      role: "HOTELIER"
    },
    {
      id: "usr_admin_01",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Hospitality Operations Admin",
      phone: "+1 (555) 999-0000",
      role: "ADMIN"
    }
  ],
  hotels: [
    {
      id: "htl_001",
      name: "The Grand Azure Resort & Spa",
      slug: "grand-azure-resort-spa",
      description: "Perched along pristine sands with panoramic ocean vistas, private infinity cabanas, Michelin-starred coastal dining, and full-service holistic hydrotherapy.",
      address: "4401 Collins Avenue",
      city: "Miami",
      country: "United States",
      starRating: 4.9,
      checkInTime: "15:00",
      checkOutTime: "11:00",
      amenities: ["Oceanfront Infinity Pool", "Hydrotherapy Spa", "Private Beach Access", "Valet Parking", "High-Speed Fiber Wi-Fi", "24/7 Concierge"],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      id: "htl_002",
      name: "Alpine Lumina Sanctuary",
      slug: "alpine-lumina-sanctuary",
      description: "A luxury alpine retreat featuring cedar-clad suites, heated thermal pools overlooking snow-dusted peaks, ski-in/ski-out access, and fondue fireside lounges.",
      address: "Bergstrasse 42",
      city: "Zurich",
      country: "Switzerland",
      starRating: 4.8,
      checkInTime: "14:00",
      checkOutTime: "11:00",
      amenities: ["Thermal Heated Pools", "Ski-In / Ski-Out Access", "Finnish Saunas", "Fireside Lounge", "Complimentary Mountain Shuttle", "Artisanal Breakfast"],
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      id: "htl_003",
      name: "Sakura Imperial Palace Hotel",
      slug: "sakura-imperial-palace-hotel",
      description: "Nestled adjacent to historical bamboo groves and serene rock gardens, delivering centuries-old omotenashi hospitality with modern minimalist luxury.",
      address: "18 Higashiyama-ku",
      city: "Kyoto",
      country: "Japan",
      starRating: 4.9,
      checkInTime: "15:00",
      checkOutTime: "12:00",
      amenities: ["Traditional Onsen Bathhouse", "Private Zen Gardens", "Authentic Tea Ceremonies", "Tatami Lounge", "Bicycle Rental", "Botanical Breakfast"],
      images: [
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80"
      ]
    }
  ],
  roomTypes: [
    {
      id: "rm_001",
      hotelId: "htl_001",
      name: "Oceanfront Deluxe King",
      description: "Spacious master bedroom with floor-to-ceiling balcony glass overlooking the Atlantic, deep soaking tub, and bespoke espresso bar.",
      maxGuests: 2,
      bedType: "1 Plush King Bed",
      basePricePerNight: 280.00,
      totalRooms: 4,
      amenities: ["Private Balcony", "Ocean View", "Marble Soaking Tub", "Nespresso Machine", "Walk-in Rain Shower"],
      images: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"
      ]
    },
    {
      id: "rm_002",
      hotelId: "htl_001",
      name: "Azure Executive Panorama Suite",
      description: "Corner suite featuring wraparound sundeck, separate living parlor with wine fridge, dining table for 4, and butler service on request.",
      maxGuests: 4,
      bedType: "1 King Bed + 1 Queen Sofa Bed",
      basePricePerNight: 460.00,
      totalRooms: 2,
      amenities: ["Wraparound Sundeck", "Butler Service", "Living Room Parlor", "Dual Vanity", "Complimentary Minibar"],
      images: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
      ]
    },
    {
      id: "rm_003",
      hotelId: "htl_002",
      name: "Alpine Fir King Chalet Room",
      description: "Warm cedar interiors, private stone fireplace, heated bathroom tiles, and sweeping views across the snow-capped valley.",
      maxGuests: 2,
      bedType: "1 King Bed with Goose Down",
      basePricePerNight: 320.00,
      totalRooms: 3,
      amenities: ["Stone Fireplace", "Heated Bathroom Floors", "Mountain Valley View", "Bose Sound System", "Ski Gear Drying Locker"],
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80"
      ]
    },
    {
      id: "rm_004",
      hotelId: "htl_003",
      name: "Imperial Garden Tatami Suite",
      description: "Handcrafted cedar woodwork, fragrant tatami mats, private outdoor stone onsen bath, and shoji screens opening onto a moss rock garden.",
      maxGuests: 3,
      bedType: "2 Traditional Futons + 1 Daybed",
      basePricePerNight: 390.00,
      totalRooms: 3,
      amenities: ["Private Outdoor Onsen", "Shoji Garden View", "Yukata Robes", "Artisanal Matcha Set", "Cedar Hinoki Tub"],
      images: [
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80"
      ]
    }
  ],
  seasonalRules: [
    {
      id: "season_summer",
      hotelId: "htl_001",
      name: "Peak Summer Beach Season",
      startDate: "06-01",
      endDate: "08-31",
      multiplier: 1.35
    },
    {
      id: "season_winter_holidays",
      hotelId: "htl_001",
      name: "Winter Festive Season",
      startDate: "12-15",
      endDate: "01-05",
      multiplier: 1.50
    },
    {
      id: "season_winter_ski",
      hotelId: "htl_002",
      name: "Peak Winter Ski Season",
      startDate: "12-01",
      endDate: "03-15",
      multiplier: 1.45
    },
    {
      id: "season_cherry_blossom",
      hotelId: "htl_003",
      name: "Spring Cherry Blossom (Sakura)",
      startDate: "03-20",
      endDate: "04-25",
      multiplier: 1.50
    }
  ]
};
