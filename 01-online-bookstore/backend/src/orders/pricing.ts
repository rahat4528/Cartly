export interface PricingQuoteItem {
  editionId: string;
  quantity: number;
}

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponApplied?: {
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
  };
  itemDetails: Array<{
    editionId: string;
    bookId: string;
    title: string;
    format: string;
    isbn: string;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
  }>;
}

export interface EditionLookup {
  id: string;
  bookId: string;
  format: string;
  isbn: string;
  salePrice: number;
  stock: number;
  bookTitle: string;
}

export interface CouponLookup {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | Date;
  isActive: boolean;
}

export class PricingEngine {
  private static TAX_RATE = 0.0825; // 8.25% standard sales tax
  private static STANDARD_SHIPPING = 4.50;
  private static FREE_SHIPPING_THRESHOLD = 50.00;

  static calculate(
    items: PricingQuoteItem[],
    editionResolver: (editionId: string) => EditionLookup | undefined,
    couponLookup?: CouponLookup
  ): PricingBreakdown {
    if (!items || items.length === 0) {
      throw new Error('Cannot calculate price for empty order items');
    }

    let subtotal = 0;
    const itemDetails: PricingBreakdown['itemDetails'] = [];

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error(`Quantity for edition ${item.editionId} must be greater than zero`);
      }

      const edition = editionResolver(item.editionId);
      if (!edition) {
        throw new Error(`Book edition ${item.editionId} does not exist`);
      }

      if (edition.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${edition.bookTitle}" (${edition.format}). Requested: ${item.quantity}, Available: ${edition.stock}`);
      }

      const unitPrice = Number(edition.salePrice);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += lineTotal;

      itemDetails.push({
        editionId: edition.id,
        bookId: edition.bookId,
        title: edition.bookTitle,
        format: edition.format,
        isbn: edition.isbn,
        unitPrice,
        totalPrice: lineTotal,
        quantity: item.quantity
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // Calculate coupon discount
    let discountAmount = 0;
    let couponApplied: PricingBreakdown['couponApplied'] | undefined;

    if (couponLookup) {
      const now = new Date();
      const expiresAt = new Date(couponLookup.expiresAt);

      if (!couponLookup.isActive) {
        throw new Error(`Coupon "${couponLookup.code}" is inactive`);
      }

      if (now > expiresAt) {
        throw new Error(`Coupon "${couponLookup.code}" expired on ${expiresAt.toISOString().split('T')[0]}`);
      }

      if (couponLookup.usedCount >= couponLookup.maxUses) {
        throw new Error(`Coupon "${couponLookup.code}" has reached its maximum usage limit`);
      }

      if (subtotal < couponLookup.minOrderAmount) {
        throw new Error(`Coupon "${couponLookup.code}" requires a minimum order amount of $${couponLookup.minOrderAmount.toFixed(2)}`);
      }

      if (couponLookup.discountType === 'PERCENT') {
        discountAmount = Number(((subtotal * couponLookup.discountValue) / 100).toFixed(2));
      } else {
        discountAmount = Math.min(subtotal, Number(couponLookup.discountValue));
      }

      couponApplied = {
        code: couponLookup.code,
        discountType: couponLookup.discountType,
        discountValue: couponLookup.discountValue
      };
    }

    const netTaxable = Math.max(0, subtotal - discountAmount);
    const shippingAmount = netTaxable >= this.FREE_SHIPPING_THRESHOLD ? 0.00 : this.STANDARD_SHIPPING;
    const taxAmount = Number((netTaxable * this.TAX_RATE).toFixed(2));
    const totalAmount = Number((netTaxable + shippingAmount + taxAmount).toFixed(2));

    return {
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      totalAmount,
      couponApplied,
      itemDetails
    };
  }
}
