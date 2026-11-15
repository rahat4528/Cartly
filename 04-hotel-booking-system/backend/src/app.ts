import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireHotelier, AuthenticatedRequest } from './auth/auth.guard.js';
import { HotelsService } from './hotels/hotels.service.js';
import { PricingService } from './pricing/pricing.service.js';
import { AvailabilityService } from './reservations/availability.service.js';
import { HotelStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const hotelsService = new HotelsService();
  const pricingService = new PricingService();
  const availabilityService = new AvailabilityService();
  const store = HotelStore.getInstance();

  const api = express.Router();

  // Health check
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '04-hotel-booking-system-backend' });
  });

  // ==================== AUTHENTICATION ====================
  api.post('/auth/register', async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  api.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = store.findUser(req.user!.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // ==================== HOTELS & PRICING ====================
  api.get('/hotels', (req, res) => {
    const hotels = hotelsService.searchHotels({
      city: req.query.city as string,
      checkIn: req.query.checkIn as string,
      checkOut: req.query.checkOut as string,
      guests: req.query.guests ? Number(req.query.guests) : 1,
      rooms: req.query.rooms ? Number(req.query.rooms) : 1,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined
    });
    res.json({ hotels });
  });

  api.get('/hotels/:idOrSlug', (req, res) => {
    const hotel = hotelsService.getHotelByIdOrSlug(
      req.params.idOrSlug,
      req.query.checkIn as string,
      req.query.checkOut as string
    );
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ hotel });
  });

  api.post('/hotels/quote', (req, res) => {
    try {
      const { hotelId, roomTypeId, checkInDate, checkOutDate, roomsCount } = req.body;
      const quote = pricingService.calculateStayQuote(
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomsCount || 1
      );
      res.json({ quote });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== RESERVATIONS & HOLDS ====================
  api.post('/reservations/hold', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const reservation = await availabilityService.createHold(req.user!.sub, req.body);
      res.status(201).json({ reservation });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.post('/reservations/:id/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { cardToken, idempotencyKey } = req.body;
      const result = availabilityService.confirmReservation(
        req.params.id,
        req.user!.sub,
        cardToken || 'tok_visa_success',
        idempotencyKey || `idem_${Date.now()}`
      );
      res.json(result);
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/reservations/my-reservations', requireAuth, (req: AuthenticatedRequest, res) => {
    store.cleanupExpiredHolds();
    const myReservations = store.reservations
      .filter(r => r.guestId === req.user!.sub)
      .map(r => {
        const hotel = store.findHotel(r.hotelId);
        const roomType = store.findRoomType(r.roomTypeId);
        return {
          ...r,
          hotelName: hotel?.name || 'Hotel',
          hotelCity: hotel?.city || '',
          hotelImage: hotel?.images?.[0] || '',
          roomTypeName: roomType?.name || 'Room'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ reservations: myReservations });
  });

  api.get('/reservations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    store.cleanupExpiredHolds();
    const reservation = store.findReservation(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    // Ensure guest can only view their own reservation unless hotelier/admin
    if (reservation.guestId !== req.user!.sub && req.user!.role !== 'HOTELIER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Access denied to this reservation.' });
    }

    const hotel = store.findHotel(reservation.hotelId);
    const roomType = store.findRoomType(reservation.roomTypeId);

    res.json({
      reservation: {
        ...reservation,
        hotel,
        roomType
      }
    });
  });

  api.post('/reservations/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const result = availabilityService.cancelReservation(
        req.params.id,
        req.user!.sub,
        req.body?.reason
      );
      res.json(result);
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  // ==================== HOTELIER OPERATIONS ====================
  api.get('/hotelier/hotels/:id/calendar', requireHotelier, (req, res) => {
    const hotel = store.findHotel(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    store.cleanupExpiredHolds();
    const roomTypes = store.roomTypes.filter(r => r.hotelId === hotel.id);
    const hotelReservations = store.reservations.filter(
      r => r.hotelId === hotel.id && (r.status === 'CONFIRMED' || r.status === 'HELD' || r.status === 'CHECKED_IN')
    );

    res.json({
      hotelId: hotel.id,
      roomTypes,
      activeReservations: hotelReservations
    });
  });

  api.patch('/hotelier/reservations/:id/status', requireHotelier, (req, res) => {
    const reservation = store.findReservation(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const { status } = req.body;
    if (status !== 'CHECKED_IN' && status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Status must be CHECKED_IN or COMPLETED' });
    }

    reservation.status = status;
    reservation.updatedAt = new Date().toISOString();
    res.json({ reservation });
  });

  app.use('/api/v1', api);

  return app;
}
