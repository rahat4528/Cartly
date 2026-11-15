import { BookstoreStore } from '../database/store.js';
import { PricingEngine, PricingQuoteItem } from './pricing.js';
import { OrderStateMachine, OrderStatus } from './state-machine.js';
import { SandboxPaymentAdapter } from '../payments/sandbox-payment.adapter.js';
import { InvoiceGenerator } from './invoice.js';
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutParams {
  userId: string;
  items: PricingQuoteItem[];
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    recipientName?: string;
  };
  couponCode?: string;
  paymentMethod?: string;
  cardNumber?: string;
  idempotencyKey?: string;
}

export class OrdersService {
  private store = BookstoreStore.getInstance();
  private paymentAdapter = new SandboxPaymentAdapter();

  getQuote(items: PricingQuoteItem[], couponCode?: string) {
    const couponLookup = couponCode ? this.store.findCoupon(couponCode) : undefined;
    return PricingEngine.calculate(
      items,
      (editionId) => {
        const ed = this.store.findEdition(editionId);
        if (!ed) return undefined;
        const book = this.store.findBook(ed.bookId);
        return {
          id: ed.id,
          bookId: ed.bookId,
          format: ed.format,
          isbn: ed.isbn,
          salePrice: Number(ed.salePrice),
          stock: ed.stock,
          bookTitle: book ? book.title : 'Untitled'
        };
      },
      couponLookup
    );
  }

  async checkout(params: CheckoutParams) {
    const { userId, items, shippingAddress, couponCode, paymentMethod, cardNumber } = params;
    const idempotencyKey = params.idempotencyKey || `idem_${uuidv4()}`;

    // Extract edition IDs for concurrency locking
    const editionIds = items.map(i => i.editionId);

    // Execute within atomic transactional edition locks to prevent race conditions & double-selling
    return await this.store.withEditionLocks(editionIds, async () => {
      // 1. Recalculate true prices and verify real-time stock on the backend
      const pricing = this.getQuote(items, couponCode);

      // 2. Generate unique order number
      const orderNumber = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Initiate payment through isolated SandboxPaymentAdapter
      const paymentResult = await this.paymentAdapter.processPayment({
        amount: pricing.totalAmount,
        currency: 'USD',
        orderNumber,
        idempotencyKey,
        paymentMethod,
        cardNumber
      });

      // 4. Handle Payment Failure: stock remains untouched!
      if (!paymentResult.success || paymentResult.status === 'FAILED') {
        // Record failed order in PENDING_PAYMENT or CANCELLED status without touching inventory
        const failedOrder = {
          id: `ord_${uuidv4().substring(0, 8)}`,
          orderNumber,
          userId,
          status: 'CANCELLED' as OrderStatus,
          subtotal: pricing.subtotal,
          discountAmount: pricing.discountAmount,
          shippingAmount: pricing.shippingAmount,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          shippingAddress,
          couponCode: pricing.couponApplied?.code || null,
          items: pricing.itemDetails,
          createdAt: new Date().toISOString(),
          failureReason: paymentResult.errorMessage || 'Payment was declined by provider'
        };
        this.store.orders.push(failedOrder);

        throw new Error(`Checkout failed: ${paymentResult.errorMessage || 'Payment failed'}`);
      }

      // 5. Payment Succeeded -> Atomically Decrement Inventory & Record Audit Movements
      for (const item of items) {
        const edition = this.store.findEdition(item.editionId);
        if (!edition) continue;

        const prevStock = edition.stock;
        edition.stock -= item.quantity;

        this.store.inventoryMovements.push({
          id: `mov_${uuidv4().substring(0, 8)}`,
          editionId: edition.id,
          orderNumber,
          changeAmount: -item.quantity,
          previousStock: prevStock,
          newStock: edition.stock,
          reason: 'PURCHASE',
          notes: `Order fulfillment for ${orderNumber}`,
          createdAt: new Date().toISOString()
        });
      }

      // 6. Update coupon usage count if applied
      if (pricing.couponApplied) {
        const coupon = this.store.findCoupon(pricing.couponApplied.code);
        if (coupon) {
          coupon.usedCount += 1;
        }
      }

      // 7. Persist Confirmed Order
      const confirmedOrder = {
        id: `ord_${uuidv4().substring(0, 8)}`,
        orderNumber,
        userId,
        status: 'PAID' as OrderStatus,
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        shippingAmount: pricing.shippingAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        shippingAddress,
        couponCode: pricing.couponApplied?.code || null,
        items: pricing.itemDetails,
        payment: {
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          amount: paymentResult.amount,
          provider: paymentResult.provider,
          idempotencyKey
        },
        timeline: [
          { status: 'PENDING_PAYMENT', timestamp: new Date(Date.now() - 1000).toISOString() },
          { status: 'PAID', timestamp: new Date().toISOString(), note: 'Payment captured successfully via Sandbox Adapter' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.store.orders.push(confirmedOrder);

      // 8. Clear user cart upon successful checkout
      this.store.carts.delete(userId);

      return {
        order: confirmedOrder,
        payment: paymentResult
      };
    });
  }

  getUserOrders(userId: string) {
    return this.store.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrderByNumber(orderNumber: string, userId?: string) {
    const order = this.store.orders.find(o => o.orderNumber === orderNumber);
    if (!order) return null;
    if (userId && order.userId !== userId) {
      const user = this.store.findUser(userId);
      if (user?.role !== 'ADMIN') {
        throw new Error('Access denied: You do not own this order');
      }
    }
    return order;
  }

  updateOrderStatus(orderNumber: string, newStatus: OrderStatus, note?: string) {
    const order = this.store.orders.find(o => o.orderNumber === orderNumber);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    // Validate using strict state machine
    OrderStateMachine.validateTransition(order.status, newStatus);

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${newStatus}`
    });

    // If order was refunded, release inventory back or record refund
    if (newStatus === 'REFUNDED') {
      for (const item of order.items) {
        const edition = this.store.findEdition(item.editionId);
        if (edition) {
          const prev = edition.stock;
          edition.stock += item.quantity;
          this.store.inventoryMovements.push({
            id: `mov_${uuidv4().substring(0, 8)}`,
            editionId: edition.id,
            orderNumber,
            changeAmount: item.quantity,
            previousStock: prev,
            newStock: edition.stock,
            reason: 'RETURN',
            notes: `Inventory restored due to refund on order ${orderNumber}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return order;
  }

  getInvoice(orderNumber: string, userId?: string) {
    const order = this.getOrderByNumber(orderNumber, userId);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    const customer = this.store.findUser(order.userId);
    const invoiceData = {
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' }),
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Valued Customer',
      customerEmail: customer ? customer.email : 'N/A',
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paymentStatus: order.payment?.status || 'PAID',
      transactionId: order.payment?.transactionId
    };

    return {
      data: invoiceData,
      formattedText: InvoiceGenerator.generateTextInvoice(invoiceData)
    };
  }
}
