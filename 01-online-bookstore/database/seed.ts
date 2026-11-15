/**
 * Database Seed Script for 01-online-bookstore
 * Populates realistic editorial bookstore catalog:
 * - Authors, Publishers, Categories
 * - Literary Works (Books) with multiple Editions (Paperback, Hardcover, Deluxe)
 * - Initial Inventory Movements
 * - Promotional Coupons
 * - Verified Customer & Administrator Accounts
 */

export interface SeedData {
  authors: any[];
  publishers: any[];
  categories: any[];
  books: any[];
  coupons: any[];
  users: any[];
}

export const initialBookstoreSeed: SeedData = {
  users: [
    {
      id: "usr_admin_001",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      role: "ADMIN",
      firstName: "Eleanor",
      lastName: "Vance",
      profile: {
        street: "742 Evergreen Terrace",
        city: "Springfield",
        state: "OR",
        postalCode: "97477",
        country: "USA",
        phone: "+1-555-0199",
        bio: "Head Curator and General Manager at Cartly Bookstore."
      }
    },
    {
      id: "usr_cust_001",
      email: "customer@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      role: "CUSTOMER",
      firstName: "Julian",
      lastName: "Blackwood",
      profile: {
        street: "12 Grosvenor Crescent",
        city: "Edinburgh",
        state: "Midlothian",
        postalCode: "EH12 5EL",
        country: "United Kingdom",
        phone: "+44-131-496-0120",
        bio: "Avid collector of mid-century speculative fiction and architectural treatises."
      }
    },
    {
      id: "usr_cust_002",
      email: "reader2@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      role: "CUSTOMER",
      firstName: "Beatrix",
      lastName: "Holloway",
      profile: {
        street: "408 Rue Saint-Honore",
        city: "Paris",
        state: "Ile-de-France",
        postalCode: "75001",
        country: "France",
        phone: "+33-1-42-68-55-00",
        bio: "Literary reviewer focusing on translated contemporary poetry and existentialist essays."
      }
    }
  ],
  authors: [
    {
      id: "auth_001",
      name: "Marcus Sterling",
      slug: "marcus-sterling",
      bio: "Award-winning speculative fiction author and member of the Royal Society of Literature, acclaimed for explorations of memory and temporal displacement.",
      nationality: "British",
      photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80",
      birthYear: 1974
    },
    {
      id: "auth_002",
      name: "Clara Chen-Vidal",
      slug: "clara-chen-vidal",
      bio: "Essayist, botanist, and natural historian examining the intersections of urban biodiversity and philosophical ecology.",
      nationality: "Canadian",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      birthYear: 1982
    },
    {
      id: "auth_003",
      name: "Dr. Alistair Thorne",
      slug: "alistair-thorne",
      bio: "Historian of ancient mathematics and cognitive linguistics at Cambridge University.",
      nationality: "Scottish",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      birthYear: 1968
    },
    {
      id: "auth_004",
      name: "Sariha Nadim",
      slug: "sariha-nadim",
      bio: "Poet and cultural anthropologist exploring post-colonial diasporic identities through lyrical free-verse narratives.",
      nationality: "Lebanese",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      birthYear: 1989
    }
  ],
  publishers: [
    {
      id: "pub_001",
      name: "Meridian House Press",
      slug: "meridian-house-press",
      country: "United Kingdom",
      website: "https://meridianhouse.press"
    },
    {
      id: "pub_002",
      name: "Archipelago Fine Editions",
      slug: "archipelago-fine-editions",
      country: "United States",
      website: "https://archipelagobooks.press"
    },
    {
      id: "pub_003",
      name: "Scribe & Solstice",
      slug: "scribe-solstice",
      country: "Germany",
      website: "https://scribesolstice.eu"
    }
  ],
  categories: [
    {
      id: "cat_001",
      name: "Literary Fiction",
      slug: "literary-fiction",
      description: "Character-driven works emphasizing nuanced prose, social insight, and stylistic depth."
    },
    {
      id: "cat_002",
      name: "Speculative & Sci-Fi",
      slug: "speculative-sci-fi",
      description: "Explorations of future civilizations, cognitive anomalies, and altered realities."
    },
    {
      id: "cat_003",
      name: "Philosophy & Essays",
      slug: "philosophy-essays",
      description: "Meditations on consciousness, aesthetics, ethics, and contemporary society."
    },
    {
      id: "cat_004",
      name: "History & Science",
      slug: "history-science",
      description: "Chronicles of human ingenuity, discoveries, and the natural cosmos."
    },
    {
      id: "cat_005",
      name: "Poetry & Anthology",
      slug: "poetry-anthology",
      description: "Lyric expressions, collected verse, and classical translations."
    }
  ],
  books: [
    {
      id: "bk_001",
      title: "The Architecture of Oblivion",
      slug: "the-architecture-of-oblivion",
      subtitle: "A Cartography of Forgotten Cities",
      synopsis: "Set in a subterranean archive buried beneath a flooded metropolis, a lonely archivist discovers a catalog of cities that never existed, yet each entry preserves the memories of its uncreated inhabitants.",
      authorId: "auth_001",
      publisherId: "pub_001",
      categoryId: "cat_002",
      language: "English",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
      publicationDate: "2024-03-15T00:00:00Z",
      featured: true,
      editions: [
        {
          id: "ed_001_pb",
          format: "PAPERBACK",
          isbn: "978-1-98765-401-2",
          pages: 368,
          listPrice: 18.99,
          salePrice: 16.50,
          stock: 45,
          sku: "ARCH-OBL-PB"
        },
        {
          id: "ed_001_hc",
          format: "HARDCOVER",
          isbn: "978-1-98765-402-9",
          pages: 384,
          listPrice: 29.99,
          salePrice: 26.99,
          stock: 22,
          sku: "ARCH-OBL-HC"
        },
        {
          id: "ed_001_dlx",
          format: "DELUXE",
          isbn: "978-1-98765-403-6",
          pages: 400,
          listPrice: 55.00,
          salePrice: 48.00,
          stock: 5, // low stock for alert testing
          sku: "ARCH-OBL-DLX"
        }
      ]
    },
    {
      id: "bk_002",
      title: "Verdant Echoes",
      slug: "verdant-echoes",
      subtitle: "Dispatches from the Fringes of the Forest",
      synopsis: "A lyrical investigation into the communicative networks of old-growth temperate rainforests, blending cutting-edge botanical field research with existential philosophy.",
      authorId: "auth_002",
      publisherId: "pub_002",
      categoryId: "cat_003",
      language: "English",
      coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
      publicationDate: "2023-09-20T00:00:00Z",
      featured: true,
      editions: [
        {
          id: "ed_002_pb",
          format: "PAPERBACK",
          isbn: "978-0-34567-891-0",
          pages: 288,
          listPrice: 16.99,
          salePrice: 14.99,
          stock: 35,
          sku: "VERD-ECH-PB"
        },
        {
          id: "ed_002_hc",
          format: "HARDCOVER",
          isbn: "978-0-34567-892-7",
          pages: 304,
          listPrice: 27.50,
          salePrice: 24.50,
          stock: 18,
          sku: "VERD-ECH-HC"
        }
      ]
    },
    {
      id: "bk_003",
      title: "The Zero and the Void",
      slug: "the-zero-and-the-void",
      subtitle: "Arabic Mathematics and the Renaissance of Logic",
      synopsis: "How medieval scholars in Baghdad and Cordoba reimagined numeric abstraction and laid the structural foundation of modern scientific inquiry.",
      authorId: "auth_003",
      publisherId: "pub_003",
      categoryId: "cat_004",
      language: "English",
      coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&q=80",
      publicationDate: "2023-11-10T00:00:00Z",
      featured: false,
      editions: [
        {
          id: "ed_003_pb",
          format: "PAPERBACK",
          isbn: "978-3-16148-410-0",
          pages: 440,
          listPrice: 22.00,
          salePrice: 19.80,
          stock: 28,
          sku: "ZERO-VOID-PB"
        },
        {
          id: "ed_003_hc",
          format: "HARDCOVER",
          isbn: "978-3-16148-411-7",
          pages: 456,
          listPrice: 34.00,
          salePrice: 31.00,
          stock: 12,
          sku: "ZERO-VOID-HC"
        }
      ]
    },
    {
      id: "bk_004",
      title: "Salt and Cartography",
      slug: "salt-and-cartography",
      subtitle: "Selected Poems 2014-2024",
      synopsis: "A breathtaking collection of verse charting the migration of coastal languages across the Mediterranean basin, accompanied by hand-drawn navigational plates.",
      authorId: "auth_004",
      publisherId: "pub_001",
      categoryId: "cat_005",
      language: "English",
      coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&q=80",
      publicationDate: "2024-05-01T00:00:00Z",
      featured: true,
      editions: [
        {
          id: "ed_004_pb",
          format: "PAPERBACK",
          isbn: "978-1-84022-790-1",
          pages: 144,
          listPrice: 14.50,
          salePrice: 12.99,
          stock: 50,
          sku: "SALT-CART-PB"
        },
        {
          id: "ed_004_dlx",
          format: "DELUXE",
          isbn: "978-1-84022-791-8",
          pages: 160,
          listPrice: 42.00,
          salePrice: 38.00,
          stock: 1, // Single remaining copy for critical concurrency testing!
          sku: "SALT-CART-DLX"
        }
      ]
    }
  ],
  coupons: [
    {
      id: "cpn_001",
      code: "EDITORIAL15",
      discountType: "PERCENT",
      discountValue: 15.00,
      minOrderAmount: 25.00,
      maxUses: 500,
      usedCount: 14,
      expiresAt: "2028-12-31T23:59:59Z",
      isActive: true
    },
    {
      id: "cpn_002",
      code: "WELCOME10",
      discountType: "FIXED",
      discountValue: 10.00,
      minOrderAmount: 40.00,
      maxUses: 200,
      usedCount: 3,
      expiresAt: "2028-12-31T23:59:59Z",
      isActive: true
    },
    {
      id: "cpn_003",
      code: "EXPIRED5",
      discountType: "PERCENT",
      discountValue: 5.00,
      minOrderAmount: 10.00,
      maxUses: 50,
      usedCount: 50,
      expiresAt: "2020-01-01T00:00:00Z",
      isActive: false
    }
  ]
};
