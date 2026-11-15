import { v4 as uuidv4 } from 'uuid';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  status: 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
}

export class SandboxPaymentAdapter {
  private static instance: SandboxPaymentAdapter;
  private idempotencyStore = new Map<string, PaymentResult>();

  static getInstance(): SandboxPaymentAdapter {
    if (!SandboxPaymentAdapter.instance) {
      SandboxPaymentAdapter.instance = new SandboxPaymentAdapter();
    }
    return SandboxPaymentAdapter.instance;
  }

  processPayment(
    amount: number,
    currency: string = 'USD',
    cardToken: string = 'tok_visa_success',
    idempotencyKey?: string
  ): PaymentResult {
    if (idempotencyKey && this.idempotencyStore.has(idempotencyKey)) {
      return this.idempotencyStore.get(idempotencyKey)!;
    }

    if (cardToken === 'tok_declined') {
      const failedResult: PaymentResult = {
        success: false,
        error: 'Payment declined: Insufficient funds or invalid card status.',
        status: 'FAILED'
      };
      if (idempotencyKey) this.idempotencyStore.set(idempotencyKey, failedResult);
      return failedResult;
    }

    const successResult: PaymentResult = {
      success: true,
      transactionId: `txn_groc_${uuidv4().substring(0, 8)}`,
      status: 'SUCCEEDED'
    };

    if (idempotencyKey) this.idempotencyStore.set(idempotencyKey, successResult);
    return successResult;
  }

  processRefund(transactionId: string, amount: number): PaymentResult {
    return {
      success: true,
      transactionId: `ref_${uuidv4().substring(0, 8)}`,
      status: 'REFUNDED'
    };
  }
}
