import { initialGrocerySeed } from '../../../database/seed.js';

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  unitType: 'EACH' | 'PER_KG' | 'PER_LB';
  stockQuantity: number;
  imageUrl: string;
  aisle: string;
  isOrganic: boolean;
}

export interface DeliverySlotRecord {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
}

export interface OrderItemRecord {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' | 'CONTACT_ME' | 'DO_NOT_SUBSTITUTE';
  substitutedWithId?: string;
  notes?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  deliverySlotId: string;
  deliverySlotDate: string;
  deliverySlotTime: string;
  deliveryAddress: string;
  contactPhone: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  driverTip: number;
  totalAmount: number;
  status: 'PLACED' | 'PICKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: OrderItemRecord[];
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  frequency: 'WEEKLY' | 'BI_WEEKLY';
  preferredDay: string;
  preferredSlotTime: string;
  itemsSummary: string;
  isActive: boolean;
  nextScheduledAt: string;
  createdAt: string;
}

export class GroceryStore {
  private static instance: GroceryStore;

  users: any[] = [];
  products: ProductRecord[] = [];
  deliverySlots: DeliverySlotRecord[] = [];
  orders: OrderRecord[] = [];
  subscriptions: SubscriptionRecord[] = [];
  payments: any[] = [];

  private constructor() {
    this.resetToSeed();
  }

  static getInstance(): GroceryStore {
    if (!GroceryStore.instance) {
      GroceryStore.instance = new GroceryStore();
    }
    return GroceryStore.instance;
  }

  resetToSeed(): void {
    this.users = JSON.parse(JSON.stringify(initialGrocerySeed.users));
    this.products = JSON.parse(JSON.stringify(initialGrocerySeed.products));
    this.deliverySlots = JSON.parse(JSON.stringify(initialGrocerySeed.deliverySlots));
    this.orders = [];
    this.subscriptions = [];
    this.payments = [];
  }

  findUser(id: string) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findProduct(idOrSlug: string) {
    return this.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  }

  findSlot(id: string) {
    return this.deliverySlots.find(s => s.id === id);
  }

  findOrder(idOrNumber: string) {
    return this.orders.find(o => o.id === idOrNumber || o.orderNumber === idOrNumber);
  }
}
