export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  orderNumber: string;
  idempotencyKey: string;
  paymentMethod?: string;
  cardNumber?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  errorMessage?: string;
  provider: string;
  timestamp: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  status: 'REFUNDED';
  timestamp: string;
}

export interface PaymentProvider {
  processPayment(options: PaymentIntentOptions): Promise<PaymentIntentResult>;
  refund(transactionId: string, amount?: number): Promise<PaymentRefundResult>;
  verifyWebhook(payload: any, signature: string): Promise<boolean>;
}
