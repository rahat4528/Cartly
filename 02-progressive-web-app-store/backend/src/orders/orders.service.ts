import { PwaStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export interface PwaCheckoutParams {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: any;
  idempotencyKey?: string;
}

export class OrdersService {
  private store = PwaStore.getInstance();

  checkout(params: PwaCheckoutParams) {
    const { userId, items, shippingAddress } = params;

    if (!items || items.length === 0) {
      throw new Error('Order items cannot be empty');
    }

    let subtotal = 0;
    const validatedItems: any[] = [];

    // Recalculate true prices on backend and verify stock
    for (const item of items) {
      const prod = this.store.findProduct(item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${prod.title}". Available: ${prod.stock}`);
      }

      const lineTotal = Number((prod.price * item.quantity).toFixed(2));
      subtotal += lineTotal;
      validatedItems.push({
        productId: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: item.quantity,
        totalPrice: lineTotal
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const taxAmount = Number((subtotal * 0.0825).toFixed(2));
    const shippingAmount = subtotal >= 100 ? 0 : 9.99;
    const totalAmount = Number((subtotal + taxAmount + shippingAmount).toFixed(2));

    // Decrement stock
    for (const it of validatedItems) {
      const prod = this.store.findProduct(it.productId);
      if (prod) {
        prod.stock -= it.quantity;
      }
    }

    const orderNumber = `PWA-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const confirmedOrder = {
      id: `ord_${uuidv4().substring(0, 8)}`,
      orderNumber,
      userId,
      status: 'PAID',
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      shippingAddress,
      items: validatedItems,
      createdAt: new Date().toISOString()
    };

    this.store.orders.push(confirmedOrder);
    this.store.carts.delete(userId);

    return confirmedOrder;
  }

  getUserOrders(userId: string) {
    return this.store.orders.filter(o => o.userId === userId);
  }
}
