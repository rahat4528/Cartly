import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, AuthenticatedRequest } from './auth/auth.guard.js';
import { FlightsService } from './flights/flights.service.js';
import { BookingsService } from './bookings/bookings.service.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const flightsService = new FlightsService();
  const bookingsService = new BookingsService();

  // Health & Demonstration Status
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'cartly-flight-booking-system',
      inventoryType: 'DEMONSTRATION',
      disclaimer: 'This service provides demonstration flight inventory only and does not issue real airline tickets.'
    });
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

  // Airports
  app.get('/api/v1/airports', (req, res) => {
    const airports = flightsService.getAirports();
    res.json({ airports });
  });

  // Flights Search
  app.get('/api/v1/flights/search', (req, res) => {
    const { origin, destination, date, cabinClass, passengers } = req.query;
    if (!origin || !destination || !date) {
      return res.status(400).json({ error: 'origin, destination, and date query parameters are required' });
    }

    const itineraries = flightsService.searchFlights({
      origin: String(origin),
      destination: String(destination),
      date: String(date),
      cabinClass: cabinClass as any,
      passengers: passengers ? Number(passengers) : 1
    });

    res.json({
      itineraries,
      isDemonstration: true,
      disclaimer: 'Simulated demonstration inventory only'
    });
  });

  app.get('/api/v1/flights/:id', (req, res) => {
    const flight = flightsService.getFlightById(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });
    res.json({ flight });
  });

  // Bookings
  app.post('/api/v1/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { flightId, flightIds, cabinClass, passengers } = req.body;
      const booking = bookingsService.createBooking({
        userId: req.user!.id,
        flightId,
        flightIds,
        cabinClass: cabinClass || 'ECONOMY',
        passengers
      });
      res.status(201).json({ booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.post('/api/v1/bookings/:id/pay', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const booking = bookingsService.payAndTicket(req.params.id, req.user!.id);
      res.json({ booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  app.get('/api/v1/bookings/my', requireAuth, (req: AuthenticatedRequest, res) => {
    const bookings = bookingsService.getUserBookings(req.user!.id);
    res.json({ bookings });
  });

  app.get('/api/v1/bookings/:id', (req, res) => {
    const booking = bookingsService.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  });

  app.post('/api/v1/bookings/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const booking = bookingsService.cancelBooking(req.params.id, req.user!.id);
      res.json({ booking });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  });

  return app;
}
