import { v4 as uuidv4 } from 'uuid';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED';
  idempotencyKey: string;
  providerRef: string;
  createdAt: string;
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
  ): { success: boolean; transactionId?: string; error?: string } {
    if (this.idempotencyStore.has(idempotencyKey)) {
      const existing = this.idempotencyStore.get(idempotencyKey)!;
      return {
        success: existing.status === 'SUCCESS',
        transactionId: existing.providerRef
      };
    }

    if (cardToken === 'tok_card_declined' || cardToken.toLowerCase().includes('declined')) {
      const failed: PaymentIntent = {
        id: `pay_${uuidv4().substring(0, 8)}`,
        amount,
        currency,
        status: 'FAILED',
        idempotencyKey,
        providerRef: `txn_declined_${uuidv4().substring(0, 8)}`,
        createdAt: new Date().toISOString()
      };
      this.idempotencyStore.set(idempotencyKey, failed);
      return {
        success: false,
        error: 'Payment declined: The card has insufficient funds or was rejected by issuer.'
      };
    }

    const success: PaymentIntent = {
      id: `pay_${uuidv4().substring(0, 8)}`,
      amount,
      currency,
      status: 'SUCCESS',
      idempotencyKey,
      providerRef: `txn_cinema_${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.idempotencyStore.set(idempotencyKey, success);

    return {
      success: true,
      transactionId: success.providerRef
    };
  }
}
