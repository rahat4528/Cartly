import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireAgent, AuthenticatedRequest } from './auth/auth.guard.js';
import { PropertiesService } from './properties/properties.service.js';
import { ToursService } from './tours/tours.service.js';
import { RealEstateStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const propertiesService = new PropertiesService();
  const toursService = new ToursService();
  const store = RealEstateStore.getInstance();

  const api = express.Router();

  // Health
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '09-real-estate-listing-platform-backend' });
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

  // Properties & Spatial Search
  api.get('/properties', (req, res) => {
    const filters: any = {
      propertyType: req.query.propertyType as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
      minLat: req.query.minLat ? Number(req.query.minLat) : undefined,
      maxLat: req.query.maxLat ? Number(req.query.maxLat) : undefined,
      minLng: req.query.minLng ? Number(req.query.minLng) : undefined,
      maxLng: req.query.maxLng ? Number(req.query.maxLng) : undefined,
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lng: req.query.lng ? Number(req.query.lng) : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
      includeAllStatus: req.query.includeAllStatus === 'true',
    };

    const list = propertiesService.getProperties(filters);
    res.json({ properties: list });
  });

  api.get('/properties/:idOrSlug', (req, res) => {
    const property = propertiesService.getPropertyById(req.params.idOrSlug);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ property });
  });

  api.post('/properties', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const property = propertiesService.createProperty(req.user!.sub, req.body);
      res.status(201).json({ property });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.put('/properties/:id', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const property = propertiesService.updateProperty(
        req.params.id,
        req.user!.sub,
        req.user!.role,
        req.body
      );
      res.json({ property });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.patch('/properties/:id/status', requireAgent, (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const property = propertiesService.updateStatus(
        req.params.id,
        req.user!.sub,
        req.user!.role,
        status
      );
      res.json({ property });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  // Tours
  api.post('/properties/:id/tours', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const tour = toursService.scheduleTour(req.user!.sub, {
        propertyId: req.params.id,
        ...req.body,
      });
      res.status(201).json({ tour });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/tours/my-tours', requireAuth, (req: AuthenticatedRequest, res) => {
    const list = toursService.getUserTours(req.user!.sub);
    res.json({ tours: list });
  });

  app.use('/api/v1', api);

  return app;
}
