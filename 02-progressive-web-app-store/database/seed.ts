export interface PwaSeedData {
  users: any[];
  categories: any[];
  products: any[];
}

export const initialPwaStoreSeed: PwaSeedData = {
  users: [
    {
      id: "usr_pwa_admin",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm",
      role: "ADMIN",
      name: "Marcus Aurelius"
    },
    {
      id: "usr_pwa_cust1",
      email: "customer@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a",
      role: "CUSTOMER",
      name: "Sophie Turner"
    }
  ],
  categories: [
    {
      id: "cat_audio",
      name: "Spatial Audio",
      slug: "spatial-audio",
      icon: "Headphones"
    },
    {
      id: "cat_wearables",
      name: "Smart Wearables",
      slug: "smart-wearables",
      icon: "Watch"
    },
    {
      id: "cat_accessories",
      name: "Power & Cables",
      slug: "power-cables",
      icon: "Zap"
    },
    {
      id: "cat_productivity",
      name: "Ergonomics",
      slug: "ergonomics",
      icon: "Laptop"
    }
  ],
  products: [
    {
      id: "prod_001",
      title: "Aura ANC Wireless Headphones",
      slug: "aura-anc-wireless-headphones",
      description: "Active noise cancelling with 40mm beryllium drivers, spatial audio tracking, and 38-hour battery longevity.",
      price: 249.00,
      stock: 35,
      categoryId: "cat_audio",
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      isFeatured: true
    },
    {
      id: "prod_002",
      title: "Chronos OLED Smartwatch",
      slug: "chronos-oled-smartwatch",
      description: "Always-on sapphire crystal display, dual-frequency GPS, biometric sleep monitoring, and titanium chassis.",
      price: 329.00,
      stock: 20,
      categoryId: "cat_wearables",
      thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
      isFeatured: true
    },
    {
      id: "prod_003",
      title: "VoltGaN 100W Compact Charger",
      slug: "voltgan-100w-compact-charger",
      description: "Next-generation Gallium Nitride multi-port adapter powering laptops, tablets, and phones concurrently.",
      price: 59.00,
      stock: 75,
      categoryId: "cat_accessories",
      thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80",
      isFeatured: false
    },
    {
      id: "prod_004",
      title: "ErgoSplit Mechanical Keyboard",
      slug: "ergosplit-mechanical-keyboard",
      description: "Split ergonomic layout with hotswappable silent tactile switches, per-key RGB, and wireless Bluetooth 5.3.",
      price: 189.00,
      stock: 1, // Single remaining copy for offline sync conflict testing!
      categoryId: "cat_productivity",
      thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
      isFeatured: true
    }
  ]
};
