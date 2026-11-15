import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireHost, AuthenticatedRequest } from './auth/auth.guard.js';
import { RestaurantsService } from './restaurants/restaurants.service.js';
import { ReservationsService } from './reservations/reservations.service.js';
import { WaitlistService } from './waitlist/waitlist.service.js';
import { RestaurantStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const restaurantsService = new RestaurantsService();
  const reservationsService = new ReservationsService();
  const waitlistService = new WaitlistService();
  const store = RestaurantStore.getInstance();

  const api = express.Router();

  // Health Check
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '05-restaurant-reservation-system-backend' });
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

  // ==================== RESTAURANTS & SLOTS ====================
  api.get('/restaurants', (req, res) => {
    const results = restaurantsService.searchRestaurants({
      cuisine: req.query.cuisine as string,
      city: req.query.city as string,
      neighborhood: req.query.neighborhood as string,
      date: req.query.date as string,
      partySize: req.query.partySize ? Number(req.query.partySize) : 2,
      priceTier: req.query.priceTier as string
    });
    res.json({ restaurants: results });
  });

  api.get('/restaurants/:idOrSlug', (req, res) => {
    const restaurant = restaurantsService.getRestaurantByIdOrSlug(
      req.params.idOrSlug,
      req.query.date as string,
      req.query.partySize ? Number(req.query.partySize) : 2,
      req.query.zone as string
    );
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json({ restaurant });
  });

  // ==================== RESERVATIONS & WAITLIST ====================
  api.post('/reservations', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const reservation = await reservationsService.createReservation(req.user!.sub, req.body);
      res.status(201).json({ reservation });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.post('/reservations/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const result = reservationsService.cancelReservation(
        req.params.id,
        req.user!.sub,
        req.user!.role,
        req.body?.reason
      );
      res.json(result);
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/reservations/my-reservations', requireAuth, (req: AuthenticatedRequest, res) => {
    const data = reservationsService.getDinerReservations(req.user!.sub);
    res.json(data);
  });

  api.get('/reservations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const reservation = store.findReservation(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (reservation.guestId !== req.user!.sub && req.user!.role !== 'HOST' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Access denied to this reservation.' });
    }

    const restaurant = store.findRestaurant(reservation.restaurantId);
    res.json({
      reservation: {
        ...reservation,
        restaurant
      }
    });
  });

  api.post('/waitlist/join', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const entry = waitlistService.joinWaitlist(req.user!.sub, req.body);
      res.status(201).json({ waitlistEntry: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/waitlist/:id/claim', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const reservation = waitlistService.claimPromoted(req.params.id, req.user!.sub);
      res.json({ reservation });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== HOST & TIMELINE ====================
  api.get('/host/restaurants/:id/timeline', requireHost, (req, res) => {
    const restaurant = store.findRestaurant(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const tables = store.diningTables.filter(t => t.restaurantId === restaurant.id);
    const dayReservations = store.reservations.filter(
      r => r.restaurantId === restaurant.id && r.reservationDate === targetDate
    );

    res.json({
      restaurantId: restaurant.id,
      date: targetDate,
      tables,
      reservations: dayReservations
    });
  });

  api.patch('/host/reservations/:id/status', requireHost, (req, res) => {
    try {
      const { status } = req.body;
      const updated = reservationsService.updateStatus(req.params.id, status);
      res.json({ reservation: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.use('/api/v1', api);

  return app;
}
