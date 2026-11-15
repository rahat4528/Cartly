import { PaymentIntentOptions, PaymentIntentResult, PaymentRefundResult, PaymentProvider } from './payment.interface.js';
import { v4 as uuidv4 } from 'uuid';

export class SandboxPaymentAdapter implements PaymentProvider {
  private transactions: Map<string, PaymentIntentResult> = new Map();
  private idempotencyStore: Map<string, PaymentIntentResult> = new Map();

  async processPayment(options: PaymentIntentOptions): Promise<PaymentIntentResult> {
    // 1. Idempotency Check
    if (this.idempotencyStore.has(options.idempotencyKey)) {
      return this.idempotencyStore.get(options.idempotencyKey)!;
    }

    // 2. Deterministic failure conditions for testing
    const shouldFail = 
      options.paymentMethod === 'simulate_failure' ||
      (options.cardNumber && options.cardNumber.endsWith('4002')) ||
      options.amount <= 0;

    const transactionId = `txn_sb_${uuidv4().substring(0, 8)}`;
    const timestamp = new Date().toISOString();

    if (shouldFail) {
      const failedResult: PaymentIntentResult = {
        success: false,
        transactionId,
        amount: options.amount,
        status: 'FAILED',
        errorMessage: 'Card declined: Insufficient funds or simulated test decline.',
        provider: 'SANDBOX',
        timestamp
      };
      this.idempotencyStore.set(options.idempotencyKey, failedResult);
      this.transactions.set(transactionId, failedResult);
      return failedResult;
    }

    const successResult: PaymentIntentResult = {
      success: true,
      transactionId,
      amount: options.amount,
      status: 'SUCCESS',
      provider: 'SANDBOX',
      timestamp
    };

    this.idempotencyStore.set(options.idempotencyKey, successResult);
    this.transactions.set(transactionId, successResult);
    return successResult;
  }

  async refund(transactionId: string, amount?: number): Promise<PaymentRefundResult> {
    const existingTxn = this.transactions.get(transactionId);
    if (!existingTxn) {
      throw new Error(`Transaction ${transactionId} not found for refund`);
    }

    if (existingTxn.status !== 'SUCCESS') {
      throw new Error(`Cannot refund transaction with status ${existingTxn.status}`);
    }

    existingTxn.status = 'REFUNDED';
    const refundId = `ref_sb_${uuidv4().substring(0, 8)}`;

    return {
      success: true,
      refundId,
      amountRefunded: amount || existingTxn.amount,
      status: 'REFUNDED',
      timestamp: new Date().toISOString()
    };
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // Deterministic signature validation for sandbox
    if (!signature) return false;
    return signature.startsWith('sha256_sb_');
  }

  getTransaction(transactionId: string): PaymentIntentResult | undefined {
    return this.transactions.get(transactionId);
  }
}
