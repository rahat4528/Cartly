import { BookstoreStore } from '../database/store.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { v4 as uuidv4 } from 'uuid';

export class AdminService {
  private store = BookstoreStore.getInstance();
  private inventoryService = new InventoryService();

  getAnalytics() {
    const totalOrders = this.store.orders.length;
    const paidOrders = this.store.orders.filter(o => 
      ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    );

    const grossRevenue = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const lowStockAlerts = this.inventoryService.getLowStockAlerts();
    const customerCount = this.store.users.filter(u => u.role === 'CUSTOMER').length;

    // Sales by Category
    const categorySales: Record<string, { name: string; unitsSold: number; revenue: number }> = {};
    for (const cat of this.store.categories) {
      categorySales[cat.id] = { name: cat.name, unitsSold: 0, revenue: 0 };
    }

    for (const order of paidOrders) {
      for (const item of order.items) {
        const edition = this.store.findEdition(item.editionId);
        if (edition) {
          const book = this.store.findBook(edition.bookId);
          if (book && categorySales[book.categoryId]) {
            categorySales[book.categoryId].unitsSold += item.quantity;
            categorySales[book.categoryId].revenue += Number(item.totalPrice);
          }
        }
      }
    }

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalOrders,
      paidOrdersCount: paidOrders.length,
      customerCount,
      lowStockCount: lowStockAlerts.length,
      lowStockAlerts,
      categorySales: Object.values(categorySales),
      recentOrders: this.store.orders.slice(-5).reverse()
    };
  }

  // Catalog Book Management
  createBook(params: {
    title: string;
    subtitle?: string;
    synopsis: string;
    authorId: string;
    publisherId: string;
    categoryId: string;
    language?: string;
    coverImage: string;
    publicationDate: string;
    featured?: boolean;
    editions: Array<{
      format: string;
      isbn: string;
      pages: number;
      listPrice: number;
      salePrice: number;
      stock: number;
      sku: string;
    }>;
  }) {
    const bookId = `bk_${uuidv4().substring(0, 8)}`;
    const slug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newBook = {
      id: bookId,
      title: params.title,
      slug,
      subtitle: params.subtitle || null,
      synopsis: params.synopsis,
      authorId: params.authorId,
      publisherId: params.publisherId,
      categoryId: params.categoryId,
      language: params.language || 'English',
      coverImage: params.coverImage,
      publicationDate: params.publicationDate,
      featured: params.featured || false,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    this.store.books.push(newBook);

    for (const ed of params.editions) {
      const editionId = `ed_${uuidv4().substring(0, 8)}`;
      const newEdition = {
        id: editionId,
        bookId,
        format: ed.format,
        isbn: ed.isbn,
        pages: ed.pages,
        listPrice: ed.listPrice,
        salePrice: ed.salePrice,
        stock: ed.stock,
        sku: ed.sku
      };
      this.store.editions.push(newEdition);

      if (ed.stock > 0) {
        this.store.inventoryMovements.push({
          id: `mov_${uuidv4().substring(0, 8)}`,
          editionId,
          orderNumber: null,
          changeAmount: ed.stock,
          previousStock: 0,
          newStock: ed.stock,
          reason: 'RESTOCK',
          notes: 'Initial inventory on book creation',
          createdAt: new Date().toISOString()
        });
      }
    }

    return newBook;
  }

  // Coupon Management
  createCoupon(params: {
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    minOrderAmount: number;
    maxUses: number;
    expiresAt: string;
  }) {
    const existing = this.store.findCoupon(params.code);
    if (existing) {
      throw new Error(`Coupon with code ${params.code} already exists`);
    }

    const newCoupon = {
      id: `cpn_${uuidv4().substring(0, 8)}`,
      code: params.code.toUpperCase(),
      discountType: params.discountType,
      discountValue: params.discountValue,
      minOrderAmount: params.minOrderAmount,
      maxUses: params.maxUses,
      usedCount: 0,
      expiresAt: params.expiresAt,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.store.coupons.push(newCoupon);
    return newCoupon;
  }

  getCoupons() {
    return this.store.coupons;
  }

  toggleCouponActive(couponId: string) {
    const coupon = this.store.coupons.find(c => c.id === couponId);
    if (!coupon) {
      throw new Error(`Coupon ${couponId} not found`);
    }
    coupon.isActive = !coupon.isActive;
    return coupon;
  }

  // Customer Management
  getCustomers() {
    return this.store.users
      .filter(u => u.role === 'CUSTOMER')
      .map(u => {
        const userOrders = this.store.orders.filter(o => o.userId === u.id);
        const totalSpent = userOrders
          .filter(o => ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status))
          .reduce((acc, o) => acc + Number(o.totalAmount), 0);

        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          profile: u.profile,
          orderCount: userOrders.length,
          totalSpent: Number(totalSpent.toFixed(2)),
          createdAt: u.createdAt
        };
      });
  }
}
