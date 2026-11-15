import { PwaStore } from '../database/store.js';

export interface ProductQueryOptions {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

export class ProductsService {
  private store = PwaStore.getInstance();

  getProducts(options: ProductQueryOptions = {}) {
    const {
      query,
      categoryId,
      minPrice,
      maxPrice,
      inStockOnly,
      sort = 'featured',
      page = 1,
      limit = 12
    } = options;

    let results = this.store.products.map(p => {
      const cat = this.store.categories.find(c => c.id === p.categoryId);
      return {
        ...p,
        categoryName: cat ? cat.name : 'Accessories'
      };
    });

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (categoryId) {
      results = results.filter(p => p.categoryId === categoryId);
    }

    if (minPrice !== undefined) {
      results = results.filter(p => p.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      results = results.filter(p => p.price <= maxPrice);
    }

    if (inStockOnly) {
      results = results.filter(p => p.stock > 0);
    }

    switch (sort) {
      case 'price_asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    const totalCount = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  getProductByIdOrSlug(idOrSlug: string) {
    const product = this.store.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (!product) return null;
    const cat = this.store.categories.find(c => c.id === product.categoryId);
    return {
      ...product,
      categoryName: cat ? cat.name : 'Accessories'
    };
  }

  getCategories() {
    return this.store.categories.map(cat => {
      const count = this.store.products.filter(p => p.categoryId === cat.id).length;
      return {
        ...cat,
        productCount: count
      };
    });
  }
}
