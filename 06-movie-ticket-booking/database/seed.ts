export const initialMovieSeed = {
  users: [
    {
      id: "usr_patron_01",
      email: "patron@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Darius Vance",
      phone: "+1 (555) 456-7890",
      role: "PATRON"
    },
    {
      id: "usr_patron_02",
      email: "patron@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Darius Vance",
      phone: "+1 (555) 456-7890",
      role: "PATRON"
    },
    {
      id: "usr_usher_01",
      email: "usher@example.com",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Marcus Green (Usher Gate 1)",
      phone: "+1 (555) 654-3210",
      role: "USHER"
    },
    {
      id: "usr_usher_02",
      email: "usher@cartly.local",
      passwordHash: "$2a$10$nGO/cVwTNqtbLdaiIgIWUeZS7eyvuREYo4qx.epM58GW.JM8fAS7a", // Pass123!
      name: "Marcus Green (Usher Gate 1)",
      phone: "+1 (555) 654-3210",
      role: "USHER"
    },
    {
      id: "usr_admin_01",
      email: "admin@example.com",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Cinema Multiplex Operations",
      phone: "+1 (555) 222-3333",
      role: "ADMIN"
    },
    {
      id: "usr_admin_02",
      email: "admin@cartly.local",
      passwordHash: "$2a$10$9NDbX5ctvzJ74J0RmsZC1.AXpuw.x/3PQi6E2qi9rvyRObyrio.Lm", // AdminPass123!
      name: "Cinema Multiplex Operations",
      phone: "+1 (555) 222-3333",
      role: "ADMIN"
    }
  ],
  movies: [
    {
      id: "mov_001",
      title: "Interstellar Echoes",
      slug: "interstellar-echoes",
      synopsis: "When an anomalous cosmic signal echoes from the edge of the Kuiper belt, a deep-space expedition voyages past the threshold of known physics into a fractured reality of time dilation.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
      genre: "Sci-Fi",
      mpaaRating: "PG-13",
      durationMinutes: 152,
      releaseDate: "2026-10-15",
      isFeatured: true
    },
    {
      id: "mov_002",
      title: "Cyber Sentinel: Rebirth",
      slug: "cyber-sentinel-rebirth",
      description: "In neon-drenched Neo-Veridia, an exiled synthetic investigator uncovers a syndicate conspiracy threatening to permanently overwrite human consciousness.",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      genre: "Cyberpunk Action",
      mpaaRating: "R",
      durationMinutes: 136,
      releaseDate: "2026-11-01",
      isFeatured: true
    },
    {
      id: "mov_003",
      title: "The Whispering Tide",
      slug: "the-whispering-tide",
      synopsis: "A coastal lighthouse keeper discovers antique glass bottles washing ashore containing handwritten letters detailing events before they occur in the village.",
      posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
      genre: "Mystery / Drama",
      mpaaRating: "PG-13",
      durationMinutes: 118,
      releaseDate: "2026-11-10",
      isFeatured: false
    }
  ],
  auditoriums: [
    {
      id: "aud_001",
      name: "Screen 1 - Grand IMAX Laser",
      screenType: "IMAX with Laser",
      totalSeats: 70,
      rowsCount: 7,
      columnsPerRow: 10
    },
    {
      id: "aud_002",
      name: "Screen 2 - Dolby Atmos Soundstage",
      screenType: "Dolby Cinema",
      totalSeats: 70,
      rowsCount: 7,
      columnsPerRow: 10
    }
  ],
  showtimes: [
    {
      id: "sht_001",
      movieId: "mov_001",
      auditoriumId: "aud_001",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "19:30",
      endTime: "22:05",
      format: "IMAX 3D"
    },
    {
      id: "sht_002",
      movieId: "mov_001",
      auditoriumId: "aud_001",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "16:15",
      endTime: "18:50",
      format: "IMAX 3D"
    },
    {
      id: "sht_003",
      movieId: "mov_002",
      auditoriumId: "aud_002",
      showDate: new Date().toISOString().split('T')[0],
      startTime: "20:00",
      endTime: "22:20",
      format: "Dolby Cinema"
    }
  ]
};
