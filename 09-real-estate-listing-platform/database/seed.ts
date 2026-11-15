export const initialRealEstateSeed = {
  users: [
    {
      id: "usr_buyer_01",
      email: "buyer@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Julian Rivera",
      phone: "+1 (555) 765-4321",
      role: "BUYER"
    },
    {
      id: "usr_buyer_02",
      email: "buyer@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Julian Rivera",
      phone: "+1 (555) 765-4321",
      role: "BUYER"
    },
    {
      id: "usr_agent_01",
      email: "agent@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Victoria Sterling (Premier Realty)",
      phone: "+1 (555) 987-6543",
      role: "REAL_ESTATE_AGENT",
      agencyName: "Sterling Sotheby's International Realty",
      licenseNo: "CA-DRE# 01984210"
    },
    {
      id: "usr_agent_02",
      email: "agent2@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Alexander Hayes (Silicon Valley Estates)",
      phone: "+1 (555) 345-6789",
      role: "REAL_ESTATE_AGENT",
      agencyName: "Hayes Global Properties",
      licenseNo: "CA-DRE# 02045678"
    },
    {
      id: "usr_admin_01",
      email: "admin@example.com",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "MLS Compliance & Platform Admin",
      phone: "+1 (555) 000-1122",
      role: "PLATFORM_ADMIN"
    },
    {
      id: "usr_admin_02",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "MLS Compliance & Platform Admin",
      phone: "+1 (555) 000-1122",
      role: "PLATFORM_ADMIN"
    }
  ],
  properties: [
    {
      id: "prop_001",
      title: "Pacific Heights Architectural Masterpiece",
      slug: "pacific-heights-architectural-masterpiece",
      description: "Custom built limestone residence overlooking the Golden Gate and Alcatraz. Features soaring ceilings, marble fireplace, wine cellar, and private rooftop garden.",
      propertyType: "SINGLE_FAMILY",
      price: 4850000,
      bedrooms: 4,
      bathrooms: 4.5,
      sqft: 4200,
      yearBuilt: 2021,
      hoaFee: 0,
      address: "2640 Broadway St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94115",
      latitude: 37.7925,
      longitude: -122.4342,
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
      ],
      status: "PUBLISHED",
      agentId: "usr_agent_01",
      priceHistory: [
        {
          id: "ph_001",
          date: "2026-09-01",
          previousPrice: 5200000,
          newPrice: 4850000,
          priceChangeAmount: -350000,
          priceChangePercent: -6.73,
          reason: "Fall Market Strategic Price Improvement"
        }
      ]
    },
    {
      id: "prop_002",
      title: "Marina District Waterfront Penthouse",
      slug: "marina-district-waterfront-penthouse",
      description: "Sun-drenched luxury corner condo with unobstructed views of the Palace of Fine Arts and Golden Gate bridge. Chef kitchen with SubZero and Wolf appliances.",
      propertyType: "CONDO",
      price: 1695000,
      bedrooms: 2,
      bathrooms: 2.0,
      sqft: 1450,
      yearBuilt: 2019,
      hoaFee: 650,
      address: "3200 Marina Blvd, Penthouse 4",
      city: "San Francisco",
      state: "CA",
      zipCode: "94123",
      latitude: 37.8035,
      longitude: -122.4410,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
      ],
      status: "PUBLISHED",
      agentId: "usr_agent_01",
      priceHistory: []
    },
    {
      id: "prop_003",
      title: "Silicon Valley Contemporary Villa",
      slug: "silicon-valley-contemporary-villa",
      description: "Gated estate in prestigious Old Palo Alto. Smart home automation, heated saltwater infinity pool, outdoor kitchen pavilion, and dedicated guest casita.",
      propertyType: "SINGLE_FAMILY",
      price: 3450000,
      bedrooms: 5,
      bathrooms: 4.0,
      sqft: 3800,
      yearBuilt: 2022,
      hoaFee: 0,
      address: "1450 Cowper St",
      city: "Palo Alto",
      state: "CA",
      zipCode: "94301",
      latitude: 37.4419,
      longitude: -122.1430,
      images: [
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"
      ],
      status: "PUBLISHED",
      agentId: "usr_agent_02",
      priceHistory: []
    },
    {
      id: "prop_004",
      title: "Oakland Hills Panoramic View Retreat",
      slug: "oakland-hills-panoramic-view-retreat",
      description: "Mid-century modern architectural sanctuary nestled among majestic redwoods with sweeping views across all three Bay Area bridges. Floor-to-ceiling glass walls.",
      propertyType: "SINGLE_FAMILY",
      price: 1895000,
      bedrooms: 3,
      bathrooms: 3.0,
      sqft: 2600,
      yearBuilt: 2018,
      hoaFee: 0,
      address: "6500 Skyline Blvd",
      city: "Oakland",
      state: "CA",
      zipCode: "94611",
      latitude: 37.8282,
      longitude: -122.2155,
      images: [
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
      ],
      status: "PUBLISHED",
      agentId: "usr_agent_02",
      priceHistory: []
    },
    {
      id: "prop_005",
      title: "Mission Bay Waterfront Designer Loft",
      slug: "mission-bay-waterfront-designer-loft",
      description: "Concrete industrial loft with 14-foot ceilings, custom steel staircase, and private harbor-facing terrace.",
      propertyType: "CONDO",
      price: 925000,
      bedrooms: 1,
      bathrooms: 1.5,
      sqft: 980,
      yearBuilt: 2020,
      hoaFee: 480,
      address: "1200 4th St, Unit 302",
      city: "San Francisco",
      state: "CA",
      zipCode: "94158",
      latitude: 37.7715,
      longitude: -122.3912,
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
      ],
      status: "DRAFT",
      agentId: "usr_agent_01",
      priceHistory: []
    }
  ]
};
