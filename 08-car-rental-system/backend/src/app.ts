import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireAgent, AuthenticatedRequest } from './auth/auth.guard.js';
import { VehiclesService } from './vehicles/vehicles.service.js';
import { PricingService } from './pricing/pricing.service.js';
import { RentalsService } from './rentals/rentals.service.js';
import { CarRentalStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const vehiclesService = new VehiclesService();
  const pricingService = new PricingService();
  const rentalsService = new RentalsService();
  const store = CarRentalStore.getInstance();

  const api = express.Router();

  // Health
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '08-car-rental-system-backend' });
  });

  // Auth
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

  api.post('/license/verify', requireAuth, (req: AuthenticatedRequest, res) => {
    const { licenseNumber, issuingState, expiryDate } = req.body;
    if (!licenseNumber || !issuingState) {
      return res.status(400).json({ error: 'License number and issuing state are required.' });
    }

    const user = store.findUser(req.user!.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.license = {
      licenseNumber,
      issuingState,
      expiryDate: expiryDate || '2029-12-31',
      status: 'VERIFIED'
    };

    res.json({ license: user.license, message: 'Driver license successfully verified.' });
  });

  // Vehicles
  api.get('/vehicles', (req, res) => {
    const list = vehiclesService.getVehicles(
      req.query.category as string,
      req.query.transmission as string,
      req.query.pickupDate as string,
      req.query.returnDate as string
    );
    res.json({ vehicles: list });
  });

  api.get('/vehicles/:id', (req, res) => {
    const vehicle = vehiclesService.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle });
  });

  // Pricing Quote
  api.post('/rentals/quote', (req, res) => {
    try {
      const { dailyRate, startDate, endDate, includeInsurance } = req.body;
      const quote = pricingService.calculateQuote(
        Number(dailyRate),
        startDate,
        endDate,
        includeInsurance ?? true
      );
      res.json({ quote });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Rentals
  api.post('/rentals', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const rental = await rentalsService.createRental(req.user!.sub, req.body);
      res.status(201).json({ rental });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/rentals/my-rentals', requireAuth, (req: AuthenticatedRequest, res) => {
    const list = rentalsService.getUserRentals(req.user!.sub);
    res.json({ rentals: list });
  });

  api.get('/rentals/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const rental = rentalsService.getRentalById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    if (
      rental.userId !== req.user!.sub &&
      req.user!.role !== 'FLEET_AGENT' &&
      req.user!.role !== 'FLEET_MANAGER'
    ) {
      return res.status(403).json({ error: 'Forbidden: You cannot access other renters contracts.' });
    }

    res.json({ rental });
  });

  // Agent Operations
  api.post('/rentals/:id/pickup', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const { odometer, fuelLevel } = req.body;
      const rental = rentalsService.pickupVehicle(
        req.params.id,
        req.user!.sub,
        Number(odometer) || 15000,
        fuelLevel || 'FULL'
      );
      res.json({ rental });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/rentals/:id/return', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const { returnOdometer, returnFuelLevel, damagesNotes, damageFee } = req.body;
      const rental = rentalsService.returnVehicle(
        req.params.id,
        req.user!.sub,
        Number(returnOdometer) || 15250,
        returnFuelLevel || 'FULL',
        damagesNotes,
        Number(damageFee) || 0.0
      );
      res.json({ rental });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/rentals/:id/settle', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const rental = rentalsService.settleRental(req.params.id, req.user!.sub);
      res.json({ rental, message: 'Security deposit released and rental completed.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/rentals/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const rental = rentalsService.cancelRental(req.params.id, req.user!.sub, req.user!.role);
      res.json({ rental, message: 'Reservation cancelled and full payment refunded.' });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  app.use('/api/v1', api);

  return app;
}
