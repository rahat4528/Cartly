import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/database/store';

describe('Accommodation Marketplace (Phase 11) - End-to-End Integration Suite', () => {
  beforeEach(() => {
    store.seed();
  });

  it('runs complete accommodation lifecycle from discovery to checkout and host management', async () => {
    // 1. Health check
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.database).toBe('cartly_airbnb_db');

    // 2. Guest Login
    const guestLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guest@example.com', password: 'Pass123!' });
    expect(guestLogin.status).toBe(200);
    const guestToken = guestLogin.body.token;

    // 3. Host Login
    const hostLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'host@example.com', password: 'Pass123!' });
    expect(hostLogin.status).toBe(200);
    const hostToken = hostLogin.body.token;

    // 4. Discover Listings
    const listingsRes = await request(app).get('/api/v1/listings');
    expect(listingsRes.status).toBe(200);
    const listingsList = listingsRes.body.listings || listingsRes.body;
    expect(listingsList.length).toBeGreaterThan(0);
    const target = listingsList[0];

    // 5. Quote Price Breakdown
    const quoteRes = await request(app)
      .post('/api/v1/bookings/quote')
      .send({
        listingId: target.id,
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guestCount: 2
      });
    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.nightsCount).toBe(4);

    // 6. Create Hold
    const holdRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listingId: target.id,
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guestCount: 2
      });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.status).toBe('PENDING');

    // 7. Confirm Reservation
    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${holdRes.body.id}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('CONFIRMED');

    // 8. Host Views Bookings
    const hostBookings = await request(app)
      .get('/api/v1/bookings/host')
      .set('Authorization', `Bearer ${hostToken}`);
    expect(hostBookings.status).toBe(200);
    expect(hostBookings.body.some((b: any) => b.id === holdRes.body.id)).toBe(true);

    // 9. Host Creates New Listing
    const newListing = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Modern Desert Oasis with Stargazing Hot Tub',
        description: 'Eco-modern architectural retreat in Joshua Tree.',
        category: 'Desert',
        location: 'Joshua Tree, California, United States',
        city: 'Joshua Tree',
        country: 'United States',
        latitude: 34.1347,
        longitude: -116.3131,
        nightlyRate: 395,
        cleaningFee: 140,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2.0,
        images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800'],
        amenities: ['Hot Tub', 'Stargazing Deck', 'Fast Wifi', 'EV Charger']
      });
    expect(newListing.status).toBe(201);
    expect(newListing.body.category).toBe('Desert');
  });
});
