import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireUsher, AuthenticatedRequest } from './auth/auth.guard.js';
import { MoviesService } from './movies/movies.service.js';
import { SeatMatrixService } from './seats/seat-matrix.service.js';
import { BookingsService } from './bookings/bookings.service.js';
import { MovieStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const moviesService = new MoviesService();
  const seatService = new SeatMatrixService();
  const bookingsService = new BookingsService();
  const store = MovieStore.getInstance();

  const api = express.Router();

  // Health Check
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '06-movie-ticket-booking-backend' });
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

  // ==================== MOVIES & SHOWTIMES ====================
  api.get('/movies', (req, res) => {
    const list = moviesService.getMovies(req.query.genre as string);
    res.json({ movies: list });
  });

  api.get('/movies/:idOrSlug', (req, res) => {
    const movie = moviesService.getMovieByIdOrSlug(
      req.params.idOrSlug,
      req.query.date as string
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ movie });
  });

  api.get('/showtimes/:id/seats', (req, res) => {
    try {
      const matrix = seatService.getShowtimeSeatMatrix(req.params.id);
      res.json(matrix);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // ==================== BOOKINGS & SEAT HOLDS ====================
  api.post('/bookings/hold', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const booking = await bookingsService.createSeatHold(req.user!.sub, req.body);
      res.status(201).json({ booking });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.post('/bookings/:id/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { cardToken, idempotencyKey } = req.body;
      const result = bookingsService.confirmBooking(
        req.params.id,
        req.user!.sub,
        cardToken || 'tok_visa_success',
        idempotencyKey || `idem_cinema_${Date.now()}`
      );
      res.json(result);
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/bookings/my-bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    const myBookings = bookingsService.getPatronBookings(req.user!.sub);
    res.json({ bookings: myBookings });
  });

  api.get('/bookings/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    store.cleanupExpiredHolds();
    const booking = store.findBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.guestId !== req.user!.sub && req.user!.role !== 'USHER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Access denied to this ticket.' });
    }

    const showtime = store.findShowtime(booking.showtimeId);
    const movie = showtime ? store.findMovie(showtime.movieId) : null;
    const auditorium = showtime ? store.findAuditorium(showtime.auditoriumId) : null;

    res.json({
      booking: {
        ...booking,
        movie,
        showtime,
        auditorium
      }
    });
  });

  // ==================== USHER ADMISSION SCANNING GATE ====================
  api.post('/usher/scan', requireUsher, (req: AuthenticatedRequest, res) => {
    try {
      const { ticketCode } = req.body;
      const result = bookingsService.admitTicket(ticketCode, req.user!.sub);
      res.json(result);
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  app.use('/api/v1', api);

  return app;
}
