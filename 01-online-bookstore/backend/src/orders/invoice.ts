export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: any;
  items: Array<{
    title: string;
    format: string;
    isbn: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  transactionId?: string;
}

export class InvoiceGenerator {
  static generateTextInvoice(data: InvoiceData): string {
    const divider = '='.repeat(68);
    const thinDivider = '-'.repeat(68);

    const lines: string[] = [
      divider,
      `                    CARTLY ONLINE BOOKSTORE`,
      `                     OFFICIAL ORDER INVOICE`,
      divider,
      `Invoice Number:  ${data.orderNumber}`,
      `Date Issued:     ${data.orderDate}`,
      `Payment Status:  ${data.paymentStatus} ${data.transactionId ? `(Ref: ${data.transactionId})` : ''}`,
      thinDivider,
      `BILLED & SHIPPED TO:`,
      `  Recipient:     ${data.customerName} (${data.customerEmail})`,
      `  Address:       ${data.shippingAddress?.street || 'N/A'}`,
      `  City / State:  ${data.shippingAddress?.city || ''}, ${data.shippingAddress?.state || ''} ${data.shippingAddress?.postalCode || ''}`,
      `  Country:       ${data.shippingAddress?.country || ''}`,
      thinDivider,
      `ITEMIZED PARTICULARS:`,
      `Qty  Format      ISBN               Price      Total   Title`,
      thinDivider
    ];

    for (const item of data.items) {
      const qty = String(item.quantity).padEnd(4);
      const fmt = item.format.substring(0, 10).padEnd(11);
      const isbn = (item.isbn || '').substring(0, 17).padEnd(18);
      const price = `$${item.unitPrice.toFixed(2)}`.padStart(8);
      const total = `$${item.totalPrice.toFixed(2)}`.padStart(9);
      const title = item.title;
      lines.push(`${qty} ${fmt} ${isbn} ${price} ${total}   ${title}`);
    }

    lines.push(thinDivider);
    lines.push(`Subtotal:                                            $${data.subtotal.toFixed(2).padStart(8)}`);
    if (data.discountAmount > 0) {
      lines.push(`Promotional Discount:                               -$${data.discountAmount.toFixed(2).padStart(8)}`);
    }
    lines.push(`Shipping & Handling:                                  $${data.shippingAmount.toFixed(2).padStart(8)}`);
    lines.push(`Estimated Sales Tax:                                  $${data.taxAmount.toFixed(2).padStart(8)}`);
    lines.push(divider);
    lines.push(`TOTAL INVOICE AMOUNT DUE:                             $${data.totalAmount.toFixed(2).padStart(8)}`);
    lines.push(divider);
    lines.push(`Thank you for your patronage. Cartly Editorial Books.`);

    return lines.join('\n');
  }
}
