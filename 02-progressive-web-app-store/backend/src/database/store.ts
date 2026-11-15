import { initialPwaStoreSeed } from '../../../database/seed.js';
import { v4 as uuidv4 } from 'uuid';

export class PwaStore {
  private static instance: PwaStore;

  users: any[] = [];
  categories: any[] = [];
  products: any[] = [];
  carts: Map<string, any[]> = new Map();
  wishlists: Map<string, Set<string>> = new Map();
  orders: any[] = [];
  syncEvents: Map<string, any> = new Map(); // idempotencyKey -> result
  deviceSubscriptions: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): PwaStore {
    if (!PwaStore.instance) {
      PwaStore.instance = new PwaStore();
    }
    return PwaStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialPwaStoreSeed.users));
    this.categories = JSON.parse(JSON.stringify(initialPwaStoreSeed.categories));
    this.products = JSON.parse(JSON.stringify(initialPwaStoreSeed.products));
    this.carts.clear();
    this.wishlists.clear();
    this.orders = [];
    this.syncEvents.clear();
    this.deviceSubscriptions = [];
  }

  findProduct(id: string) {
    return this.products.find(p => p.id === id || p.slug === id);
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
}
