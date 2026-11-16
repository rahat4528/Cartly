import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service';
import { authGuard, AuthenticatedRequest } from './auth/auth.guard';
import { ListingsService } from './listings/listings.service';
import { BookingsService } from './bookings/bookings.service';
import { PricingService } from './pricing/pricing.service';
import { ReviewsService } from './reviews/reviews.service';
import { store } from './database/store';

export function createApp(): express.Application {
  const application = express();

  application.use(cors());
  application.use(express.json());

  // Health Check
  application.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'cartly-airbnb-backend',
      database: 'cartly_airbnb_db',
      timestamp: new Date().toISOString()
    });
  });

  // Authentication
  application.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = AuthService.login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(result);
  });

  // Listings
  application.get('/api/v1/listings', (req, res) => {
    const filters = {
      category: req.query.category as string,
      city: req.query.city as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      guests: req.query.guests ? parseInt(req.query.guests as string, 10) : undefined
    };

    const listings = ListingsService.getListings(filters);
    res.json({ listings, total: listings.length });
  });

  application.get('/api/v1/listings/:id', (req, res) => {
    const listing = ListingsService.getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const reviews = ReviewsService.getListingReviews(listing.id);
    res.json({ listing: { ...listing, reviews }, ...listing, reviews });
  });

  application.post('/api/v1/listings', authGuard(['HOST', 'ADMIN']), (req: AuthenticatedRequest, res) => {
    try {
      const listing = ListingsService.createListing(req.user!.id, req.body);
      res.status(201).json({ listing, ...listing });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  application.patch('/api/v1/listings/:id', authGuard(['HOST', 'ADMIN']), (req: AuthenticatedRequest, res) => {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const listing = ListingsService.updateListing(req.params.id, req.user!.id, req.body, isAdmin);
      res.json({ listing, ...listing });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  // Pricing Quotes (Backend Authority)
  const handleQuote = (req: express.Request, res: express.Response) => {
    try {
      const listingId = req.params.id || req.body.listingId;
      const { checkIn, checkOut, guestCount } = req.body;
      const listing = store.listings.find(l => l.id === listingId);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });

      const quote = PricingService.calculatePrice(listing, checkIn, checkOut, parseInt(guestCount, 10) || 1);
      res.json({ quote, ...quote });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  application.post('/api/v1/listings/:id/quote', handleQuote);
  application.post('/api/v1/bookings/quote', handleQuote);

  // Bookings & Reservation Holds
  const handleHold = async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { listingId, checkIn, checkOut, guestCount } = req.body;
      if (!listingId || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'listingId, checkIn, and checkOut are required' });
      }

      const booking = await BookingsService.createHold(
        req.user!.id,
        listingId,
        checkIn,
        checkOut,
        parseInt(guestCount, 10) || 1
      );

      res.status(201).json({ booking, ...booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  };

  application.post('/api/v1/bookings', authGuard(['GUEST', 'ADMIN']), handleHold);
  application.post('/api/v1/bookings/hold', authGuard(['GUEST', 'ADMIN']), handleHold);

  application.post('/api/v1/bookings/:id/confirm', authGuard(['GUEST', 'ADMIN']), (req: AuthenticatedRequest, res) => {
    try {
      const confirmed = BookingsService.confirmBooking(req.params.id, req.user!.id);
      res.json({ booking: confirmed, ...confirmed });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  application.post('/api/v1/bookings/:id/cancel', authGuard(), (req: AuthenticatedRequest, res) => {
    try {
      const isHost = req.user!.role === 'HOST';
      const cancelled = BookingsService.cancelBooking(req.params.id, req.user!.id, isHost);
      res.json({ booking: cancelled, ...cancelled });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  application.get('/api/v1/bookings/my', authGuard(['GUEST', 'ADMIN']), (req: AuthenticatedRequest, res) => {
    const bookings = BookingsService.getGuestBookings(req.user!.id);
    res.json(bookings);
  });

  application.get('/api/v1/bookings/host', authGuard(['HOST', 'ADMIN']), (req: AuthenticatedRequest, res) => {
    const bookings = BookingsService.getHostBookings(req.user!.id);
    res.json(bookings);
  });

  // Reviews with Verified Post-Stay Gate
  const handleReview = (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const listingId = req.params.id || req.body.listingId;
      const { rating, comment } = req.body;
      const review = ReviewsService.createReview(req.user!.id, listingId, rating, comment);
      res.status(201).json({ review, ...review });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  };

  application.post('/api/v1/listings/:id/reviews', authGuard(['GUEST', 'ADMIN']), handleReview);
  application.post('/api/v1/reviews', authGuard(['GUEST', 'ADMIN']), handleReview);

  application.get('/api/v1/listings/:id/reviews', (req, res) => {
    const reviews = ReviewsService.getListingReviews(req.params.id);
    res.json(reviews);
  });

  return application;
}

export const app = createApp();
