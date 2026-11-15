import express from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, AuthenticatedRequest } from './auth/auth.guard.js';
import { ProductsService } from './products/products.service.js';
import { CartService } from './cart/cart.service.js';
import { OrdersService } from './orders/orders.service.js';
import { SyncService } from './sync/sync.service.js';
import { PushService } from './push/push.service.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const productsService = new ProductsService();
  const cartService = new CartService();
  const ordersService = new OrdersService();
  const syncService = new SyncService();
  const pushService = new PushService();

  const api = express.Router();

  // Health
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: '02-progressive-web-app-store-api', timestamp: new Date().toISOString() });
  });

  // Auth
  api.post('/auth/register', async (req, res) => {
    try {
      const data = await authService.register(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/auth/login', async (req, res) => {
    try {
      const data = await authService.login(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  api.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Products & Categories
  api.get('/products', (req, res) => {
    const options = {
      query: req.query.query as string,
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      inStockOnly: req.query.inStockOnly === 'true',
      sort: req.query.sort as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12
    };
    res.json(productsService.getProducts(options));
  });

  api.get('/products/:idOrSlug', (req, res) => {
    const p = productsService.getProductByIdOrSlug(req.params.idOrSlug);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  });

  api.get('/categories', (_req, res) => {
    res.json(productsService.getCategories());
  });

  // Live Cart
  api.get('/cart', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(cartService.getCart(req.user!.sub));
  });

  api.post('/cart/items', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { productId, quantity } = req.body;
      const cart = cartService.addItem(req.user!.sub, productId, quantity || 1);
      res.status(201).json(cart);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.patch('/cart/items/:productId', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { quantity } = req.body;
      const cart = cartService.updateQuantity(req.user!.sub, req.params.productId, quantity);
      res.json(cart);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.delete('/cart/items/:productId', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(cartService.removeItem(req.user!.sub, req.params.productId));
  });

  // Online Checkout (Forbidden offline)
  api.post('/orders/checkout', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, idempotencyKey } = req.body;
      const order = ordersService.checkout({
        userId: req.user!.sub,
        items,
        shippingAddress,
        idempotencyKey
      });
      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/orders', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(ordersService.getUserOrders(req.user!.sub));
  });

  // Offline Background Sync Processing
  api.post('/sync/batch', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { events } = req.body;
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'Events array is required' });
      }
      const syncResult = syncService.processBatch(req.user!.sub, events);
      res.json(syncResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Push Notifications
  api.post('/push/subscribe', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const result = pushService.subscribe(req.user!.sub, req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/push/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    res.json(pushService.unsubscribe(endpoint));
  });

  api.post('/admin/push/broadcast', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const result = pushService.broadcast(req.body);
    res.json(result);
  });

  app.use('/api/v1', api);
  return app;
}
