import express, { Request, Response } from 'express';
import cors from 'cors';
import { AuthService } from './auth/auth.service.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth/auth.guard.js';
import { CatalogService } from './catalog/catalog.service.js';
import { CartService } from './cart/cart.service.js';
import { OrdersService } from './orders/orders.service.js';
import { ReviewsService } from './reviews/reviews.service.js';
import { InventoryService } from './inventory/inventory.service.js';
import { AdminService } from './admin/admin.service.js';
import { BookstoreStore } from './database/store.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authService = new AuthService();
  const catalogService = new CatalogService();
  const cartService = new CartService();
  const ordersService = new OrdersService();
  const reviewsService = new ReviewsService();
  const inventoryService = new InventoryService();
  const adminService = new AdminService();

  const api = express.Router();

  // Healthcheck
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: '01-online-bookstore-api', timestamp: new Date().toISOString() });
  });

  // ==================== AUTH ROUTES ====================
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
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  api.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // ==================== CATALOG ROUTES ====================
  api.get('/catalog/books', (req, res) => {
    try {
      const options = {
        query: req.query.query as string,
        isbn: req.query.isbn as string,
        categoryId: req.query.categoryId as string,
        authorId: req.query.authorId as string,
        format: req.query.format as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        sort: req.query.sort as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12
      };
      const data = catalogService.getBooks(options);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  api.get('/catalog/books/isbn/:isbn', (req, res) => {
    const result = catalogService.findByIsbn(req.params.isbn);
    if (!result) return res.status(404).json({ error: `No book found matching ISBN ${req.params.isbn}` });
    res.json(result);
  });

  api.get('/catalog/books/:idOrSlug', (req, res) => {
    const book = catalogService.getBookByIdOrSlug(req.params.idOrSlug);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  });

  api.get('/catalog/books/:id/recommendations', (req, res) => {
    const recommendations = catalogService.getRecommendations(req.params.id);
    res.json(recommendations);
  });

  api.get('/catalog/categories', (_req, res) => {
    res.json(catalogService.getCategories());
  });

  api.get('/catalog/authors', (_req, res) => {
    res.json(catalogService.getAuthors());
  });

  api.get('/catalog/authors/:id', (req, res) => {
    const author = catalogService.getAuthorById(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  });

  // ==================== CART & WISHLIST ROUTES ====================
  api.get('/cart', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(cartService.getCart(req.user!.sub));
  });

  api.post('/cart/items', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { editionId, quantity } = req.body;
      const cart = cartService.addItem(req.user!.sub, editionId, quantity || 1);
      res.status(201).json(cart);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.patch('/cart/items/:editionId', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { quantity } = req.body;
      const cart = cartService.updateQuantity(req.user!.sub, req.params.editionId, quantity);
      res.json(cart);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.delete('/cart/items/:editionId', requireAuth, (req: AuthenticatedRequest, res) => {
    const cart = cartService.removeItem(req.user!.sub, req.params.editionId);
    res.json(cart);
  });

  api.get('/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(cartService.getWishlist(req.user!.sub));
  });

  api.post('/wishlist/toggle/:bookId', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const result = cartService.toggleWishlist(req.user!.sub, req.params.bookId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== ORDERS & CHECKOUT ROUTES ====================
  api.post('/orders/quote', (req, res) => {
    try {
      const { items, couponCode } = req.body;
      const quote = ordersService.getQuote(items, couponCode);
      res.json(quote);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.post('/orders/checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, couponCode, paymentMethod, cardNumber, idempotencyKey } = req.body;
      const result = await ordersService.checkout({
        userId: req.user!.sub,
        items,
        shippingAddress,
        couponCode,
        paymentMethod,
        cardNumber,
        idempotencyKey
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/orders', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json(ordersService.getUserOrders(req.user!.sub));
  });

  api.get('/orders/:orderNumber', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const order = ordersService.getOrderByNumber(req.params.orderNumber, req.user!.sub);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  api.get('/orders/:orderNumber/invoice', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const invoice = ordersService.getInvoice(req.params.orderNumber, req.user!.sub);
      res.json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== REVIEWS ====================
  api.post('/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { bookId, rating, title, comment } = req.body;
      const review = reviewsService.createReview({
        userId: req.user!.sub,
        bookId,
        rating,
        title,
        comment
      });
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/reviews/book/:bookId', (req, res) => {
    res.json(reviewsService.getBookReviews(req.params.bookId));
  });

  // ==================== ADMIN ROUTES ====================
  api.get('/admin/analytics', requireAdmin, (_req, res) => {
    res.json(adminService.getAnalytics());
  });

  api.post('/admin/catalog/books', requireAdmin, (req, res) => {
    try {
      const book = adminService.createBook(req.body);
      res.status(201).json(book);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/admin/inventory/alerts', requireAdmin, (_req, res) => {
    res.json(inventoryService.getLowStockAlerts());
  });

  api.post('/admin/inventory/adjust', requireAdmin, (req, res) => {
    try {
      const result = inventoryService.adjustStock(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/admin/inventory/movements', requireAdmin, (_req, res) => {
    res.json(inventoryService.getAllMovements());
  });

  api.get('/admin/orders', requireAdmin, (_req, res) => {
    res.json(BookstoreStore.getInstance().orders);
  });

  api.patch('/admin/orders/:orderNumber/status', requireAdmin, (req, res) => {
    try {
      const { status, note } = req.body;
      const updated = ordersService.updateOrderStatus(req.params.orderNumber, status, note);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/admin/coupons', requireAdmin, (_req, res) => {
    res.json(adminService.getCoupons());
  });

  api.post('/admin/coupons', requireAdmin, (req, res) => {
    try {
      const coupon = adminService.createCoupon(req.body);
      res.status(201).json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.patch('/admin/coupons/:id/toggle', requireAdmin, (req, res) => {
    try {
      const coupon = adminService.toggleCouponActive(req.params.id);
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  api.get('/admin/customers', requireAdmin, (_req, res) => {
    res.json(adminService.getCustomers());
  });

  api.get('/admin/reviews', requireAdmin, (_req, res) => {
    res.json(reviewsService.getAllReviewsForAdmin());
  });

  api.patch('/admin/reviews/:id/moderate', requireAdmin, (req, res) => {
    try {
      const { isApproved } = req.body;
      const review = reviewsService.moderateReview(req.params.id, isApproved);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.use('/api/v1', api);
  return app;
}
