import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireStaff, AuthenticatedRequest } from './auth/auth.guard.js';
import { ProductsService } from './products/products.service.js';
import { DeliverySlotsService } from './delivery/slots.service.js';
import { OrdersService } from './orders/orders.service.js';
import { SubscriptionsService } from './subscriptions/subscriptions.service.js';
import { GroceryStore } from './database/store.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const productsService = new ProductsService();
  const slotsService = new DeliverySlotsService();
  const ordersService = new OrdersService();
  const subsService = new SubscriptionsService();
  const store = GroceryStore.getInstance();

  const api = express.Router();

  // Health
  api.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: '07-grocery-delivery-app-backend' });
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

  // Products
  api.get('/products', (req, res) => {
    const list = productsService.getProducts(
      req.query.category as string,
      req.query.q as string
    );
    res.json({ products: list });
  });

  api.get('/products/:idOrSlug', (req, res) => {
    const product = productsService.getProductById(req.params.idOrSlug);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  });

  // Delivery Slots
  api.get('/delivery-slots', (req, res) => {
    const slots = slotsService.getSlots(req.query.date as string);
    res.json({ slots });
  });

  // Orders
  api.post('/orders', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await ordersService.createOrder(req.user!.sub, req.body);
      res.status(201).json({ order });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  api.get('/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
    const orders = ordersService.getCustomerOrders(req.user!.sub);
    res.json({ orders });
  });

  api.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const order = ordersService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (
      order.userId !== req.user!.sub &&
      req.user!.role !== 'PICKER_DRIVER' &&
      req.user!.role !== 'STORE_ADMIN'
    ) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other shopper orders.' });
    }

    res.json({ order });
  });

  api.patch('/orders/:id/status', requireStaff, (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const order = ordersService.updateOrderStatus(req.params.id, status);
      res.json({ order });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const order = ordersService.cancelOrder(req.params.id, req.user!.sub, req.user!.role);
      res.json({ order, message: 'Order cancelled and payment refunded successfully.' });
    } catch (err: any) {
      const code = err.statusCode || 400;
      res.status(code).json({ error: err.message });
    }
  });

  // Subscriptions
  api.post('/subscriptions', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const sub = subsService.createSubscription(req.user!.sub, req.body);
      res.status(201).json({ subscription: sub });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/subscriptions/my-subscriptions', requireAuth, (req: AuthenticatedRequest, res) => {
    const subs = subsService.getUserSubscriptions(req.user!.sub);
    res.json({ subscriptions: subs });
  });

  app.use('/api/v1', api);

  return app;
}
