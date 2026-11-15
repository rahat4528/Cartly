import { initialBookstoreSeed } from '../../../database/seed.js';
import { v4 as uuidv4 } from 'uuid';

export class BookstoreStore {
  private static instance: BookstoreStore;

  users: any[] = [];
  authors: any[] = [];
  publishers: any[] = [];
  categories: any[] = [];
  books: any[] = [];
  editions: any[] = [];
  coupons: any[] = [];
  carts: Map<string, any[]> = new Map(); // userId -> items[]
  wishlists: Map<string, Set<string>> = new Map(); // userId -> Set<bookId>
  orders: any[] = [];
  payments: any[] = [];
  inventoryMovements: any[] = [];
  reviews: any[] = [];

  // Transaction lock queue for concurrency protection
  private editionLocks: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): BookstoreStore {
    if (!BookstoreStore.instance) {
      BookstoreStore.instance = new BookstoreStore();
    }
    return BookstoreStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialBookstoreSeed.users));
    this.authors = JSON.parse(JSON.stringify(initialBookstoreSeed.authors));
    this.publishers = JSON.parse(JSON.stringify(initialBookstoreSeed.publishers));
    this.categories = JSON.parse(JSON.stringify(initialBookstoreSeed.categories));
    this.coupons = JSON.parse(JSON.stringify(initialBookstoreSeed.coupons));
    
    // Deep copy books and extract flat editions
    this.books = [];
    this.editions = [];
    for (const b of initialBookstoreSeed.books) {
      const bookCopy = JSON.parse(JSON.stringify(b));
      const editions = bookCopy.editions || [];
      delete bookCopy.editions;
      this.books.push(bookCopy);

      for (const ed of editions) {
        this.editions.push({
          ...ed,
          bookId: bookCopy.id
        });
      }
    }

    this.carts.clear();
    this.wishlists.clear();
    this.orders = [];
    this.payments = [];
    this.inventoryMovements = [];
    this.reviews = [];
    this.editionLocks.clear();

    // Initial inventory movement records for initial seed stock
    for (const ed of this.editions) {
      this.inventoryMovements.push({
        id: `mov_init_${ed.id}`,
        editionId: ed.id,
        orderId: null,
        changeAmount: ed.stock,
        previousStock: 0,
        newStock: ed.stock,
        reason: 'RESTOCK',
        notes: 'Initial warehouse stocking from publisher',
        createdAt: new Date().toISOString()
      });
    }
  }

  // Mutex lock for atomic transactional operations on editions
  async withEditionLocks<T>(editionIds: string[], fn: () => Promise<T>): Promise<T> {
    const sortedIds = [...new Set(editionIds)].sort();
    
    // Wait for all locks sequentially to avoid deadlocks
    for (const id of sortedIds) {
      while (this.editionLocks.has(id)) {
        await this.editionLocks.get(id);
      }
    }

    // Acquire locks
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    for (const id of sortedIds) {
      this.editionLocks.set(id, lockPromise);
    }

    try {
      return await fn();
    } finally {
      for (const id of sortedIds) {
        this.editionLocks.delete(id);
      }
      releaseLock!();
    }
  }

  findEdition(editionId: string) {
    return this.editions.find(e => e.id === editionId);
  }

  findBook(bookId: string) {
    return this.books.find(b => b.id === bookId);
  }

  findAuthor(authorId: string) {
    return this.authors.find(a => a.id === authorId);
  }

  findPublisher(publisherId: string) {
    return this.publishers.find(p => p.id === publisherId);
  }

  findCategory(categoryId: string) {
    return this.categories.find(c => c.id === categoryId);
  }

  findUser(userId: string) {
    return this.users.find(u => u.id === userId);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findCoupon(code: string) {
    return this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  }
}
