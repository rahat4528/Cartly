import { PwaStore } from '../database/store.js';

export interface PendingSyncAction {
  idempotencyKey: string;
  actionType: 'ADD_TO_CART' | 'UPDATE_CART_QUANTITY' | 'REMOVE_CART_ITEM' | 'TOGGLE_WISHLIST' | 'CHECKOUT';
  payload: any;
  clientTimestamp?: number;
}

export interface SyncActionResult {
  idempotencyKey: string;
  actionType: string;
  status: 'APPLIED' | 'REJECTED' | 'CONFLICT';
  message: string;
  details?: any;
}

export class SyncService {
  private store = PwaStore.getInstance();

  processBatch(userId: string, events: PendingSyncAction[]) {
    const results: SyncActionResult[] = [];

    for (const event of events) {
      // 1. Idempotency Check: if this exact event was processed previously, return cached outcome
      if (this.store.syncEvents.has(event.idempotencyKey)) {
        results.push(this.store.syncEvents.get(event.idempotencyKey));
        continue;
      }

      const result = this.processSingleEvent(userId, event);
      this.store.syncEvents.set(event.idempotencyKey, result);
      results.push(result);
    }

    // Return the updated live cart state along with per-event outcomes
    const currentCart = this.getUserCart(userId);

    return {
      processedCount: events.length,
      results,
      cart: currentCart
    };
  }

  private processSingleEvent(userId: string, event: PendingSyncAction): SyncActionResult {
    const { idempotencyKey, actionType, payload } = event;

    // Rule: NO offline checkout allowed
    if (actionType === 'CHECKOUT') {
      return {
        idempotencyKey,
        actionType,
        status: 'REJECTED',
        message: 'Offline checkout rejected. Payment and final order validation strictly require live network connectivity.'
      };
    }

    if (actionType === 'ADD_TO_CART') {
      const { productId, quantity = 1, expectedPrice } = payload;
      const product = this.store.findProduct(productId);

      if (!product) {
        return {
          idempotencyKey,
          actionType,
          status: 'REJECTED',
          message: `Product ${productId} no longer exists in store catalog.`
        };
      }

      // Conflict Check: Out of Stock
      if (product.stock <= 0) {
        return {
          idempotencyKey,
          actionType,
          status: 'CONFLICT',
          message: `Item "${product.title}" became out of stock while you were offline.`,
          details: { productId, stock: 0 }
        };
      }

      // Conflict Check: Stale Price
      let priceConflict = false;
      if (expectedPrice !== undefined && Number(expectedPrice) !== Number(product.price)) {
        priceConflict = true;
      }

      // Apply to cart up to available stock
      const userItems = this.store.carts.get(userId) || [];
      const existing = userItems.find(it => it.productId === productId);
      const cappedQuantity = Math.min(quantity, product.stock);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + cappedQuantity, product.stock);
      } else {
        userItems.push({ productId, quantity: cappedQuantity });
      }
      this.store.carts.set(userId, userItems);

      if (priceConflict) {
        return {
          idempotencyKey,
          actionType,
          status: 'CONFLICT',
          message: `Price for "${product.title}" updated from $${expectedPrice} to $${product.price}. Item added at latest price.`,
          details: { productId, newPrice: product.price, oldPrice: expectedPrice }
        };
      }

      return {
        idempotencyKey,
        actionType,
        status: 'APPLIED',
        message: `Successfully added ${cappedQuantity} x "${product.title}" to cart.`
      };
    }

    if (actionType === 'UPDATE_CART_QUANTITY') {
      const { productId, quantity } = payload;
      const product = this.store.findProduct(productId);
      const userItems = this.store.carts.get(userId) || [];
      const item = userItems.find(it => it.productId === productId);

      if (!item) {
        return {
          idempotencyKey,
          actionType,
          status: 'REJECTED',
          message: 'Item not found in current cart.'
        };
      }

      if (quantity <= 0) {
        const filtered = userItems.filter(it => it.productId !== productId);
        this.store.carts.set(userId, filtered);
        return {
          idempotencyKey,
          actionType,
          status: 'APPLIED',
          message: 'Item removed from cart.'
        };
      }

      if (product && quantity > product.stock) {
        item.quantity = product.stock;
        this.store.carts.set(userId, userItems);
        return {
          idempotencyKey,
          actionType,
          status: 'CONFLICT',
          message: `Requested quantity exceeded available stock. Capped at ${product.stock}.`
        };
      }

      item.quantity = quantity;
      this.store.carts.set(userId, userItems);
      return {
        idempotencyKey,
        actionType,
        status: 'APPLIED',
        message: 'Cart quantity updated.'
      };
    }

    if (actionType === 'REMOVE_CART_ITEM') {
      const { productId } = payload;
      const userItems = this.store.carts.get(userId) || [];
      const filtered = userItems.filter(it => it.productId !== productId);
      this.store.carts.set(userId, filtered);
      return {
        idempotencyKey,
        actionType,
        status: 'APPLIED',
        message: 'Item removed from cart.'
      };
    }

    if (actionType === 'TOGGLE_WISHLIST') {
      const { productId } = payload;
      let userWishlist = this.store.wishlists.get(userId);
      if (!userWishlist) {
        userWishlist = new Set();
        this.store.wishlists.set(userId, userWishlist);
      }

      let active = false;
      if (userWishlist.has(productId)) {
        userWishlist.delete(productId);
        active = false;
      } else {
        userWishlist.add(productId);
        active = true;
      }

      return {
        idempotencyKey,
        actionType,
        status: 'APPLIED',
        message: active ? 'Added to wishlist' : 'Removed from wishlist',
        details: { inWishlist: active }
      };
    }

    return {
      idempotencyKey,
      actionType,
      status: 'REJECTED',
      message: `Unknown action type: ${actionType}`
    };
  }

  private getUserCart(userId: string) {
    const rawItems = this.store.carts.get(userId) || [];
    let subtotal = 0;
    const items = [];

    for (const item of rawItems) {
      const prod = this.store.findProduct(item.productId);
      if (!prod) continue;
      const lineTotal = Number((prod.price * item.quantity).toFixed(2));
      subtotal += lineTotal;
      items.push({
        productId: prod.id,
        title: prod.title,
        price: prod.price,
        thumbnail: prod.thumbnail,
        quantity: item.quantity,
        lineTotal,
        stock: prod.stock
      });
    }

    return {
      userId,
      items,
      itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
      subtotal: Number(subtotal.toFixed(2))
    };
  }
}
