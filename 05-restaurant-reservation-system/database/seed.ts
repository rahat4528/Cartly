export const initialRestaurantSeed = {
  users: [
    {
      id: "usr_diner_01",
      email: "diner@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Marcus Sterling",
      phone: "+1 (555) 345-6789",
      role: "DINER"
    },
    {
      id: "usr_host_01",
      email: "host@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Camille Laurent",
      phone: "+1 (555) 765-4321",
      role: "HOST"
    },
    {
      id: "usr_admin_01",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Dining Platform Administrator",
      phone: "+1 (555) 000-1111",
      role: "ADMIN"
    }
  ],
  restaurants: [
    {
      id: "rst_001",
      name: "L'Aura Osteria & Bar",
      slug: "laura-osteria-bar",
      description: "Artisanal hand-rolled pasta, wood-fired seasonal crudos, and a curated 400-bottle Italian wine cellar set in a candlelit industrial SoHo loft.",
      cuisine: "Northern Italian",
      priceTier: "$$$",
      address: "142 Mercer Street",
      city: "New York",
      neighborhood: "SoHo",
      openTime: "17:00",
      closeTime: "22:30",
      amenities: ["Sommelier Service", "Wood-Fired Hearth", "Patio Garden", "Valet Parking", "Full Cocktail Bar"],
      images: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      id: "rst_002",
      name: "Bistrot Lumière",
      slug: "bistrot-lumiere",
      description: "Parisian cafe culture brought to life with classic steak frites, duck confit, fresh baguettes, and zinc-topped bar cocktails under warm brass lights.",
      cuisine: "French Bistro",
      priceTier: "$$$",
      address: "88 Bedford Street",
      city: "New York",
      neighborhood: "West Village",
      openTime: "17:00",
      closeTime: "23:00",
      amenities: ["Outdoor Sidewalk Cafe", "Natural Wine List", "Late Night Dining", "Romantic Ambiance"],
      images: [
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      id: "rst_003",
      name: "Omakase Kensho",
      slug: "omakase-kensho",
      description: "An intimate 12-seat cedar counter offering an austere 18-course Edomae nigiri journey with fish flown directly from Tokyo's Toyosu Market.",
      cuisine: "Japanese Omakase",
      priceTier: "$$$$",
      address: "21 Harrison Street",
      city: "New York",
      neighborhood: "Tribeca",
      openTime: "17:30",
      closeTime: "22:00",
      amenities: ["Chef's Tasting Counter", "Rare Sake Pairings", "Pre-Paid Seatings", "A5 Wagyu Supplement"],
      images: [
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80"
      ]
    }
  ],
  diningTables: [
    {
      id: "tbl_001",
      restaurantId: "rst_001",
      tableNumber: "T1",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 1,
      maxCapacity: 2,
      isCombinable: false,
      combinableWithTableIds: []
    },
    {
      id: "tbl_002",
      restaurantId: "rst_001",
      tableNumber: "T2",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 1,
      maxCapacity: 2,
      isCombinable: true,
      combinableWithTableIds: ["tbl_003"]
    },
    {
      id: "tbl_003",
      restaurantId: "rst_001",
      tableNumber: "T3",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 1,
      maxCapacity: 2,
      isCombinable: true,
      combinableWithTableIds: ["tbl_002"]
    },
    {
      id: "tbl_004",
      restaurantId: "rst_001",
      tableNumber: "T4",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 3,
      maxCapacity: 4,
      isCombinable: true,
      combinableWithTableIds: ["tbl_005"]
    },
    {
      id: "tbl_005",
      restaurantId: "rst_001",
      tableNumber: "T5",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 3,
      maxCapacity: 4,
      isCombinable: true,
      combinableWithTableIds: ["tbl_004"]
    },
    {
      id: "tbl_006",
      restaurantId: "rst_001",
      tableNumber: "T6",
      seatingZone: "INDOOR_MAIN",
      minCapacity: 5,
      maxCapacity: 6,
      isCombinable: false,
      combinableWithTableIds: []
    },
    {
      id: "tbl_007",
      restaurantId: "rst_001",
      tableNumber: "P1",
      seatingZone: "PATIO_TERRACE",
      minCapacity: 2,
      maxCapacity: 4,
      isCombinable: false,
      combinableWithTableIds: []
    },
    {
      id: "tbl_008",
      restaurantId: "rst_001",
      tableNumber: "B1",
      seatingZone: "BAR_HIGHTOP",
      minCapacity: 1,
      maxCapacity: 2,
      isCombinable: false,
      combinableWithTableIds: []
    },
    {
      id: "tbl_009",
      restaurantId: "rst_001",
      tableNumber: "C1",
      seatingZone: "CHEFS_COUNTER",
      minCapacity: 1,
      maxCapacity: 2,
      isCombinable: false,
      combinableWithTableIds: []
    }
  ]
};
