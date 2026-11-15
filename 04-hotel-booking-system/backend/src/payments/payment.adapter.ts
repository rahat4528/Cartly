import { v4 as uuidv4 } from 'uuid';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  idempotencyKey: string;
  providerRef: string;
  createdAt: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentRecord?: PaymentIntent;
}

export class SandboxPaymentAdapter {
  private static instance: SandboxPaymentAdapter;
  private idempotencyStore = new Map<string, PaymentIntent>();

  static getInstance(): SandboxPaymentAdapter {
    if (!SandboxPaymentAdapter.instance) {
      SandboxPaymentAdapter.instance = new SandboxPaymentAdapter();
    }
    return SandboxPaymentAdapter.instance;
  }

  processPayment(
    amount: number,
    currency: string = 'USD',
    cardToken: string,
    idempotencyKey: string
  ): PaymentResult {
    // Check idempotency
    if (this.idempotencyStore.has(idempotencyKey)) {
      const existing = this.idempotencyStore.get(idempotencyKey)!;
      return {
        success: existing.status === 'SUCCESS',
        transactionId: existing.providerRef,
        paymentRecord: existing
      };
    }

    // Deterministic simulation
    if (cardToken === 'tok_card_declined' || cardToken.toLowerCase().includes('declined')) {
      const failedRecord: PaymentIntent = {
        id: `pay_${uuidv4().substring(0, 8)}`,
        amount,
        currency,
        status: 'FAILED',
        idempotencyKey,
        providerRef: `txn_declined_${uuidv4().substring(0, 8)}`,
        createdAt: new Date().toISOString()
      };
      this.idempotencyStore.set(idempotencyKey, failedRecord);
      return {
        success: false,
        error: 'Payment declined: The card has insufficient funds or was rejected by issuer.',
        paymentRecord: failedRecord
      };
    }

    const successRecord: PaymentIntent = {
      id: `pay_${uuidv4().substring(0, 8)}`,
      amount,
      currency,
      status: 'SUCCESS',
      idempotencyKey,
      providerRef: `txn_hotel_${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.idempotencyStore.set(idempotencyKey, successRecord);

    return {
      success: true,
      transactionId: successRecord.providerRef,
      paymentRecord: successRecord
    };
  }

  processRefund(providerRef: string, refundAmount: number): { success: boolean; refundRef: string } {
    return {
      success: true,
      refundRef: `ref_${uuidv4().substring(0, 8)}`
    };
  }
}
