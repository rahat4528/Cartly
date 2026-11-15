import { GroceryStore } from '../database/store.js';

export class ProductsService {
  private store = GroceryStore.getInstance();

  getProducts(category?: string, query?: string) {
    let list = this.store.products;

    if (category && category.trim()) {
      const c = category.toLowerCase().trim();
      list = list.filter(p => p.category.toLowerCase().includes(c));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.aisle.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getProductById(idOrSlug: string) {
    return this.store.findProduct(idOrSlug);
  }
}
