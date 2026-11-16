import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireRole, AuthenticatedRequest } from './auth/auth.guard.js';
import { ListingsService } from './listings/listings.service.js';
import { PricingService } from './pricing/pricing.service.js';
import { BookingsService } from './bookings/bookings.service.js';
import { ReviewsService } from './reviews/reviews.service.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const listingsService = new ListingsService();
  const pricingService = new PricingService();
  const bookingsService = new BookingsService();
  const reviewsService = new ReviewsService();

  // Health
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', service: 'cartly-airbnb-clone' });
  });

  // Auth
  app.post('/api/v1/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const result = authService.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  app.get('/api/v1/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Listings
  app.get('/api/v1/listings', (req, res) => {
    const { category, city, guests, checkIn, checkOut } = req.query;
    const listings = listingsService.getListings({
      category: category ? String(category) : undefined,
      city: city ? String(city) : undefined,
      guests: guests ? Number(guests) : undefined,
      checkIn: checkIn ? String(checkIn) : undefined,
      checkOut: checkOut ? String(checkOut) : undefined
    });
    res.json({ listings });
  });

  app.get('/api/v1/listings/:id', (req, res) => {
    const listing = listingsService.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const reviews = reviewsService.getReviewsForListing(req.params.id);
    res.json({ listing, reviews });
  });

  app.post('/api/v1/listings', requireAuth, requireRole('HOST'), (req: AuthenticatedRequest, res) => {
    try {
      const listing = listingsService.createListing(req.body, req.user!.id);
      res.status(201).json({ listing });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.put('/api/v1/listings/:id', requireAuth, requireRole('HOST'), (req: AuthenticatedRequest, res) => {
    try {
      const listing = listingsService.updateListing(req.params.id, req.body, req.user!.id);
      res.json({ listing });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  // Price Quote Endpoint (Backend authority)
  app.post('/api/v1/listings/:id/quote', (req, res) => {
    try {
      const listing = listingsService.getListingById(req.params.id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      const { checkIn, checkOut } = req.body;
      const quote = pricingService.calculatePrice(listing, checkIn, checkOut);
      res.json({ quote });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  // Bookings
  app.post('/api/v1/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { listingId, checkIn, checkOut, guestCount } = req.body;
      const booking = bookingsService.createHold({
        listingId,
        guestId: req.user!.id,
        checkIn,
        checkOut,
        guestCount: Number(guestCount || 1)
      });
      res.status(201).json({ booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.post('/api/v1/bookings/:id/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const booking = bookingsService.confirmBooking(req.params.id, req.user!.id);
      res.json({ booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.post('/api/v1/bookings/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const result = bookingsService.cancelBooking(req.params.id, req.user!.id);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.get('/api/v1/bookings/my', requireAuth, (req: AuthenticatedRequest, res) => {
    const bookings = bookingsService.getGuestBookings(req.user!.id);
    res.json({ bookings });
  });

  app.get('/api/v1/host/bookings', requireAuth, requireRole('HOST'), (req: AuthenticatedRequest, res) => {
    const bookings = bookingsService.getHostBookings(req.user!.id);
    res.json({ bookings });
  });

  // Reviews
  app.post('/api/v1/listings/:id/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { rating, comment } = req.body;
      const review = reviewsService.addReview(
        req.params.id,
        req.user!.id,
        req.user!.name,
        Number(rating),
        String(comment)
      );
      res.status(201).json({ review });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  return app;
}
