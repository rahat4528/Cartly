export const initialGrocerySeed = {
  users: [
    {
      id: "usr_shopper_01",
      email: "customer@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Olivia Chen",
      phone: "+1 (555) 789-0123",
      role: "CUSTOMER",
      address: "742 Evergreen Terrace, Apt 4B"
    },
    {
      id: "usr_shopper_02",
      email: "customer@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Olivia Chen",
      phone: "+1 (555) 789-0123",
      role: "CUSTOMER",
      address: "742 Evergreen Terrace, Apt 4B"
    },
    {
      id: "usr_driver_01",
      email: "driver@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Sam Rodriguez (Fulfillment Courier)",
      phone: "+1 (555) 321-7654",
      role: "PICKER_DRIVER",
      address: "Cartly Fulfillment Hub #4"
    },
    {
      id: "usr_driver_02",
      email: "driver@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Sam Rodriguez (Fulfillment Courier)",
      phone: "+1 (555) 321-7654",
      role: "PICKER_DRIVER",
      address: "Cartly Fulfillment Hub #4"
    },
    {
      id: "usr_admin_01",
      email: "admin@example.com",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Supermarket Operations Manager",
      phone: "+1 (555) 111-2222",
      role: "STORE_ADMIN",
      address: "Central Distribution Center"
    },
    {
      id: "usr_admin_02",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Supermarket Operations Manager",
      phone: "+1 (555) 111-2222",
      role: "STORE_ADMIN",
      address: "Central Distribution Center"
    }
  ],
  products: [
    {
      id: "prd_001",
      name: "Organic Hass Avocados (4-Pack)",
      slug: "organic-hass-avocados-4pk",
      category: "Produce",
      description: "Ripe, creamy organic Hass avocados packed with healthy monounsaturated fats.",
      price: 4.99,
      unitType: "EACH",
      stockQuantity: 120,
      imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 1 - Fresh Organic Produce",
      isOrganic: true
    },
    {
      id: "prd_002",
      name: "Whole Grass-Fed Milk (1 Gallon)",
      slug: "whole-grass-fed-milk-1gal",
      category: "Dairy & Eggs",
      description: "Pasture-raised whole milk, gently pasteurized and non-homogenized for rich flavor.",
      price: 4.29,
      unitType: "EACH",
      stockQuantity: 85,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 2 - Dairy & Refrigerated",
      isOrganic: true
    },
    {
      id: "prd_003",
      name: "Artisanal Sourdough Boule",
      slug: "artisanal-sourdough-boule",
      category: "Bakery",
      description: "Naturally fermented sourdough with a blistered crust and chewy, open crumb.",
      price: 5.49,
      unitType: "EACH",
      stockQuantity: 40,
      imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 3 - Fresh Artisan Bakery",
      isOrganic: false
    },
    {
      id: "prd_004",
      name: "Pasture-Raised Grade A Large Brown Eggs (12ct)",
      slug: "pasture-raised-brown-eggs-12ct",
      category: "Dairy & Eggs",
      description: "Hens with 108 square feet of pasture outdoor roam each. Rich deep amber yolks.",
      price: 5.19,
      unitType: "EACH",
      stockQuantity: 95,
      imageUrl: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 2 - Dairy & Refrigerated",
      isOrganic: true
    },
    {
      id: "prd_005",
      name: "Fresh Atlantic Salmon Fillet",
      slug: "fresh-atlantic-salmon-fillet",
      category: "Meat & Seafood",
      description: "Sustainably sourced skin-on salmon fillet, rich in omega-3 fatty acids.",
      price: 13.99,
      unitType: "PER_LB",
      stockQuantity: 30,
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 4 - Fresh Seafood Butcher",
      isOrganic: false
    },
    {
      id: "prd_006",
      name: "Organic Crisp Gala Apples (3lb Bag)",
      slug: "organic-crisp-gala-apples-3lb",
      category: "Produce",
      description: "Sweet, crunchy orchard-grown Gala apples perfect for snacking or salads.",
      price: 4.89,
      unitType: "EACH",
      stockQuantity: 110,
      imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 1 - Fresh Organic Produce",
      isOrganic: true
    },
    {
      id: "prd_007",
      name: "Authentic Greek Strained Yogurt (32oz)",
      slug: "authentic-greek-strained-yogurt-32oz",
      category: "Dairy & Eggs",
      description: "Triple-strained whole milk plain Greek yogurt with 18g protein per serving.",
      price: 5.69,
      unitType: "EACH",
      stockQuantity: 60,
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 2 - Dairy & Refrigerated",
      isOrganic: false
    },
    {
      id: "prd_008",
      name: "Organic Single-Origin Cold Brew Coffee (32oz)",
      slug: "organic-cold-brew-coffee-32oz",
      category: "Beverages",
      description: "Steeped for 20 hours in small batches. Smooth, low acidity, naturally sweet notes.",
      price: 4.99,
      unitType: "EACH",
      stockQuantity: 50,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
      aisle: "Aisle 5 - Beverages & Refreshments",
      isOrganic: true
    }
  ],
  deliverySlots: [
    {
      id: "slt_001",
      slotDate: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00",
      maxCapacity: 10,
      bookedCount: 2
    },
    {
      id: "slt_002",
      slotDate: new Date().toISOString().split('T')[0],
      startTime: "11:00",
      endTime: "12:00",
      maxCapacity: 10,
      bookedCount: 4
    },
    {
      id: "slt_003",
      slotDate: new Date().toISOString().split('T')[0],
      startTime: "14:00",
      endTime: "15:00",
      maxCapacity: 10,
      bookedCount: 1
    },
    {
      id: "slt_004",
      slotDate: new Date().toISOString().split('T')[0],
      startTime: "17:00",
      endTime: "18:00",
      maxCapacity: 10,
      bookedCount: 9 // Almost full!
    },
    {
      id: "slt_005",
      slotDate: new Date().toISOString().split('T')[0],
      startTime: "19:00",
      endTime: "20:00",
      maxCapacity: 2,
      bookedCount: 2 // SOLD OUT!
    }
  ]
};
