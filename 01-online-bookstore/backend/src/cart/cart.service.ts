import { BookstoreStore } from '../database/store.js';

export class CartService {
  private store = BookstoreStore.getInstance();

  getCart(userId: string) {
    const rawItems = this.store.carts.get(userId) || [];
    const items = [];
    let subtotal = 0;

    for (const item of rawItems) {
      const edition = this.store.findEdition(item.editionId);
      if (!edition) continue;

      const book = this.store.findBook(edition.bookId);
      const unitPrice = Number(edition.salePrice);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += lineTotal;

      items.push({
        editionId: edition.id,
        bookId: edition.bookId,
        title: book ? book.title : 'Unknown Title',
        coverImage: book ? book.coverImage : '',
        format: edition.format,
        isbn: edition.isbn,
        unitPrice,
        lineTotal,
        quantity: item.quantity,
        availableStock: edition.stock,
        isOutOfStock: edition.stock < item.quantity
      });
    }

    return {
      userId,
      items,
      itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
      subtotal: Number(subtotal.toFixed(2))
    };
  }

  addItem(userId: string, editionId: string, quantity = 1) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    const edition = this.store.findEdition(editionId);
    if (!edition) {
      throw new Error(`Edition ${editionId} not found`);
    }

    if (edition.stock <= 0) {
      throw new Error('This edition is currently out of stock');
    }

    const currentItems = this.store.carts.get(userId) || [];
    const existingIndex = currentItems.findIndex(it => it.editionId === editionId);

    if (existingIndex >= 0) {
      const newQuantity = currentItems[existingIndex].quantity + quantity;
      if (newQuantity > edition.stock) {
        throw new Error(`Cannot add more copies. Maximum available stock is ${edition.stock}`);
      }
      currentItems[existingIndex].quantity = newQuantity;
    } else {
      if (quantity > edition.stock) {
        throw new Error(`Cannot add ${quantity} copies. Maximum available stock is ${edition.stock}`);
      }
      currentItems.push({ editionId, quantity });
    }

    this.store.carts.set(userId, currentItems);
    return this.getCart(userId);
  }

  updateQuantity(userId: string, editionId: string, quantity: number) {
    const currentItems = this.store.carts.get(userId) || [];
    const itemIndex = currentItems.findIndex(it => it.editionId === editionId);

    if (itemIndex < 0) {
      throw new Error('Item not found in shopping cart');
    }

    if (quantity <= 0) {
      currentItems.splice(itemIndex, 1);
    } else {
      const edition = this.store.findEdition(editionId);
      if (!edition) {
        throw new Error('Edition not found');
      }

      if (quantity > edition.stock) {
        throw new Error(`Requested quantity exceeds available stock (${edition.stock})`);
      }

      currentItems[itemIndex].quantity = quantity;
    }

    this.store.carts.set(userId, currentItems);
    return this.getCart(userId);
  }

  removeItem(userId: string, editionId: string) {
    const currentItems = this.store.carts.get(userId) || [];
    const filtered = currentItems.filter(it => it.editionId !== editionId);
    this.store.carts.set(userId, filtered);
    return this.getCart(userId);
  }

  clearCart(userId: string) {
    this.store.carts.delete(userId);
  }

  // Wishlist methods
  getWishlist(userId: string) {
    const bookIds = this.store.wishlists.get(userId) || new Set();
    const books = [];
    for (const id of bookIds) {
      const book = this.store.findBook(id);
      if (book) {
        const author = this.store.findAuthor(book.authorId);
        const editions = this.store.editions.filter(e => e.bookId === book.id);
        books.push({
          ...book,
          author: author ? author.name : 'Unknown Author',
          startingPrice: editions.length > 0 ? Math.min(...editions.map(e => Number(e.salePrice))) : 0
        });
      }
    }
    return books;
  }

  toggleWishlist(userId: string, bookId: string) {
    const book = this.store.findBook(bookId);
    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }

    let userWishlist = this.store.wishlists.get(userId);
    if (!userWishlist) {
      userWishlist = new Set();
      this.store.wishlists.set(userId, userWishlist);
    }

    let added = false;
    if (userWishlist.has(bookId)) {
      userWishlist.delete(bookId);
      added = false;
    } else {
      userWishlist.add(bookId);
      added = true;
    }

    return {
      bookId,
      isInWishlist: added,
      totalSaved: userWishlist.size
    };
  }
}
