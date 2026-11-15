import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service';
import { authGuard, AuthenticatedRequest } from './auth/auth.guard';
import { PropertiesService } from './properties/properties.service';
import { ViewingsService } from './viewings/viewings.service';
import { ApplicationsService } from './applications/applications.service';
import { LeasesService } from './leases/leases.service';
import { MaintenanceService } from './maintenance/maintenance.service';
import { PaymentsService } from './payments/payments.service';

export const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cartly-house-rental-backend',
    database: 'cartly_house_rental_db',
    timestamp: new Date().toISOString()
  });
});

// Authentication
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = AuthService.login(email, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json(result);
});

// Properties
app.get('/api/v1/properties', (req, res) => {
  const filters = {
    propertyType: req.query.propertyType as string,
    minRent: req.query.minRent ? parseFloat(req.query.minRent as string) : undefined,
    maxRent: req.query.maxRent ? parseFloat(req.query.maxRent as string) : undefined,
    bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string, 10) : undefined,
    petPolicy: req.query.petPolicy as string,
    city: req.query.city as string,
    status: req.query.status as string
  };

  const properties = PropertiesService.getProperties(filters);
  res.json(properties);
});

app.get('/api/v1/properties/:id', (req, res) => {
  const property = PropertiesService.getPropertyById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

app.post('/api/v1/properties', authGuard(['LANDLORD', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const property = PropertiesService.createProperty(req.user!.id, req.body);
    res.status(201).json(property);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// Viewings
app.post('/api/v1/viewings', authGuard(['TENANT', 'ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { propertyId, slotTime, notes } = req.body;
    if (!propertyId || !slotTime) {
      return res.status(400).json({ error: 'propertyId and slotTime are required' });
    }

    const viewing = await ViewingsService.scheduleViewing(propertyId, req.user!.id, slotTime, notes);
    res.status(201).json(viewing);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.get('/api/v1/viewings', authGuard(), (req: AuthenticatedRequest, res) => {
  if (req.user!.role === 'TENANT') {
    return res.json(ViewingsService.getTenantViewings(req.user!.id));
  }
  const propertyId = req.query.propertyId as string;
  if (!propertyId) return res.status(400).json({ error: 'propertyId query param required for landlord viewing schedule' });
  res.json(ViewingsService.getPropertyViewings(propertyId));
});

// Applications
app.post('/api/v1/applications', authGuard(['TENANT', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const appRecord = ApplicationsService.submitApplication(req.user!.id, req.body);
    res.status(201).json(appRecord);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.get('/api/v1/applications', authGuard(), (req: AuthenticatedRequest, res) => {
  if (req.user!.role === 'LANDLORD') {
    return res.json(ApplicationsService.getLandlordApplications(req.user!.id));
  }
  res.json(ApplicationsService.getTenantApplications(req.user!.id));
});

app.patch('/api/v1/applications/:id/status', authGuard(['LANDLORD', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const { status, notes } = req.body;
    const updated = ApplicationsService.updateApplicationStatus(req.params.id, req.user!.id, status, notes);
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// Leases
app.post('/api/v1/leases', authGuard(['LANDLORD', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const lease = LeasesService.createLeaseOffer(req.user!.id, req.body);
    res.status(201).json(lease);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.post('/api/v1/leases/:id/sign', authGuard(['TENANT', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const signed = LeasesService.signLease(req.params.id, req.user!.id);
    res.json(signed);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.get('/api/v1/leases', authGuard(), (req: AuthenticatedRequest, res) => {
  if (req.user!.role === 'LANDLORD') {
    return res.json(LeasesService.getLandlordLeases(req.user!.id));
  }
  res.json(LeasesService.getTenantLeases(req.user!.id));
});

// Maintenance
app.post('/api/v1/maintenance', authGuard(['TENANT', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const ticket = MaintenanceService.createTicket(req.user!.id, req.body);
    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.get('/api/v1/maintenance', authGuard(), (req: AuthenticatedRequest, res) => {
  if (req.user!.role === 'LANDLORD') {
    return res.json(MaintenanceService.getLandlordTickets(req.user!.id));
  }
  res.json(MaintenanceService.getTenantTickets(req.user!.id));
});

app.patch('/api/v1/maintenance/:id/status', authGuard(['LANDLORD', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const ticket = MaintenanceService.updateTicketStatus(req.params.id, req.user!.id, status, resolutionNotes);
    res.json(ticket);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// Payments
app.post('/api/v1/payments/process', authGuard(['TENANT', 'ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentId, paymentMethod } = req.body;
    const payment = await PaymentsService.processRentPayment(paymentId, req.user!.id, paymentMethod);
    res.json(payment);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

app.get('/api/v1/payments/ledger', authGuard(['TENANT', 'ADMIN']), (req: AuthenticatedRequest, res) => {
  const ledger = PaymentsService.getTenantLedger(req.user!.id);
  res.json(ledger);
});
