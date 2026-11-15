import { store, RentPayment } from '../database/store';
import { v4 as uuidv4 } from 'uuid';

export class PaymentsService {
  static async processRentPayment(
    paymentId: string,
    tenantId: string,
    paymentMethod: string = 'SANDBOX_CARD'
  ): Promise<RentPayment> {
    const payment = store.payments.find(p => p.id === paymentId && p.tenantId === tenantId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === 'PAID') {
      const err = new Error('Payment already fulfilled');
      (err as any).statusCode = 400;
      throw err;
    }

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const receiptNum = `RCPT-${yearMonth}-${Math.floor(1000 + Math.random() * 9000)}`;

    payment.status = 'PAID';
    payment.paidAt = new Date().toISOString();
    payment.paymentMethod = paymentMethod;
    payment.transactionRef = `TXN-${uuidv4().substring(0, 10).toUpperCase()}`;
    payment.receiptNumber = receiptNum;

    return payment;
  }

  static getTenantLedger(tenantId: string): RentPayment[] {
    return store.payments.filter(p => p.tenantId === tenantId);
  }
}
