import { PwaStore } from '../database/store.js';

export class CartService {
  private store = PwaStore.getInstance();

  getCart(userId: string) {
    const rawItems = this.store.carts.get(userId) || [];
    let subtotal = 0;
    const items = [];

    for (const it of rawItems) {
      const prod = this.store.findProduct(it.productId);
      if (!prod) continue;

      const lineTotal = Number((prod.price * it.quantity).toFixed(2));
      subtotal += lineTotal;

      items.push({
        productId: prod.id,
        title: prod.title,
        price: prod.price,
        thumbnail: prod.thumbnail,
        quantity: it.quantity,
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

  addItem(userId: string, productId: string, quantity = 1) {
    const prod = this.store.findProduct(productId);
    if (!prod) throw new Error(`Product ${productId} not found`);
    if (prod.stock <= 0) throw new Error(`Product "${prod.title}" is currently out of stock`);

    const items = this.store.carts.get(userId) || [];
    const existing = items.find(it => it.productId === productId);

    if (existing) {
      if (existing.quantity + quantity > prod.stock) {
        throw new Error(`Requested quantity exceeds available inventory (${prod.stock})`);
      }
      existing.quantity += quantity;
    } else {
      if (quantity > prod.stock) {
        throw new Error(`Requested quantity exceeds available inventory (${prod.stock})`);
      }
      items.push({ productId, quantity });
    }

    this.store.carts.set(userId, items);
    return this.getCart(userId);
  }

  updateQuantity(userId: string, productId: string, quantity: number) {
    const items = this.store.carts.get(userId) || [];
    const index = items.findIndex(it => it.productId === productId);
    if (index < 0) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      items.splice(index, 1);
    } else {
      const prod = this.store.findProduct(productId);
      if (prod && quantity > prod.stock) {
        throw new Error(`Requested quantity exceeds available inventory (${prod.stock})`);
      }
      items[index].quantity = quantity;
    }

    this.store.carts.set(userId, items);
    return this.getCart(userId);
  }

  removeItem(userId: string, productId: string) {
    const items = this.store.carts.get(userId) || [];
    const filtered = items.filter(it => it.productId !== productId);
    this.store.carts.set(userId, filtered);
    return this.getCart(userId);
  }

  clearCart(userId: string) {
    this.store.carts.delete(userId);
  }
}
