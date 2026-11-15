import { GroceryStore, OrderRecord, OrderItemRecord } from '../database/store.js';
import { DeliverySlotsService } from '../delivery/slots.service.js';
import { OrderStateMachine, OrderStatus } from './state-machine.js';
import { SandboxPaymentAdapter } from '../payments/payment.adapter.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  substitutionPolicy?: 'SUBSTITUTE_BEST_MATCH' | 'CONTACT_ME' | 'DO_NOT_SUBSTITUTE';
  notes?: string;
}

export interface CreateOrderDto {
  deliverySlotId: string;
  deliveryAddress: string;
  contactPhone: string;
  deliveryNotes?: string;
  items: CreateOrderItemDto[];
  driverTip?: number;
  cardToken?: string;
  idempotencyKey?: string;
}

export class OrdersService {
  private store = GroceryStore.getInstance();
  private slotsService = new DeliverySlotsService();
  private paymentAdapter = SandboxPaymentAdapter.getInstance();

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderRecord> {
    const { deliverySlotId, deliveryAddress, contactPhone, deliveryNotes, items, driverTip, cardToken, idempotencyKey } = dto;

    if (!items || items.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    if (!deliveryAddress || !contactPhone) {
      throw new Error('Delivery address and contact phone are required.');
    }

    // 1. Authoritative price recalculation & stock verification
    const orderItems: OrderItemRecord[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = this.store.findProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} was not found in the catalog.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stockQuantity}`);
      }

      const itemTotal = Math.round(product.price * item.quantity * 100) / 100;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        substitutionPolicy: item.substitutionPolicy || 'SUBSTITUTE_BEST_MATCH',
        notes: item.notes || ''
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = 4.99;
    const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% sales tax
    const tip = driverTip !== undefined ? Math.max(0, driverTip) : 3.00;
    const totalAmount = Math.round((subtotal + deliveryFee + tax + tip) * 100) / 100;

    // 2. Reserve delivery slot (atomic capacity check)
    const slot = await this.slotsService.reserveSlot(deliverySlotId);

    // 3. Process payment
    const payment = this.paymentAdapter.processPayment(
      totalAmount,
      'USD',
      cardToken || 'tok_visa_success',
      idempotencyKey || `idem_groc_${Date.now()}`
    );

    if (!payment.success) {
      // Release slot upon payment failure
      this.slotsService.releaseSlot(deliverySlotId);
      const err: any = new Error(payment.error || 'Payment declined');
      err.statusCode = 402;
      throw err;
    }

    // 4. Decrement inventory
    for (const item of items) {
      const product = this.store.findProduct(item.productId);
      if (product) {
        product.stockQuantity -= item.quantity;
      }
    }

    // 5. Create Order Record
    const orderNumber = `ORD-GRC-${Math.floor(100000 + Math.random() * 900000)}`;
    const order: OrderRecord = {
      id: `ord_${uuidv4().substring(0, 8)}`,
      orderNumber,
      userId,
      deliverySlotId,
      deliverySlotDate: slot.slotDate,
      deliverySlotTime: `${slot.startTime}-${slot.endTime}`,
      deliveryAddress,
      contactPhone,
      deliveryNotes: deliveryNotes || '',
      subtotal,
      deliveryFee,
      tax,
      driverTip: tip,
      totalAmount,
      status: 'PLACED',
      items: orderItems,
      paymentRef: payment.transactionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.orders.push(order);
    return order;
  }

  updateOrderStatus(orderId: string, nextStatus: OrderStatus): OrderRecord {
    const order = this.store.findOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    OrderStateMachine.validate(order.status, nextStatus);
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();

    return order;
  }

  cancelOrder(orderId: string, userId: string, role: string): OrderRecord {
    const order = this.store.findOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.userId !== userId && role !== 'STORE_ADMIN') {
      const err: any = new Error('Forbidden: You can only cancel your own grocery orders.');
      err.statusCode = 403;
      throw err;
    }

    if (order.status !== 'PLACED') {
      throw new Error(`Cannot cancel order in status ${order.status}. Cancellation only allowed prior to picking.`);
    }

    OrderStateMachine.validate(order.status, 'CANCELLED');
    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();

    // Release delivery slot
    this.slotsService.releaseSlot(order.deliverySlotId);

    // Restock items
    for (const item of order.items) {
      const product = this.store.findProduct(item.productId);
      if (product) {
        product.stockQuantity += item.quantity;
      }
    }

    // Process refund
    if (order.paymentRef) {
      this.paymentAdapter.processRefund(order.paymentRef, order.totalAmount);
    }

    return order;
  }

  getCustomerOrders(userId: string): OrderRecord[] {
    return this.store.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrderById(orderId: string): OrderRecord | null {
    return this.store.findOrder(orderId) || null;
  }
}
