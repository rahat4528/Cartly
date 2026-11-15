import { BookstoreStore } from '../database/store.js';

export interface CatalogFilterOptions {
  query?: string;
  isbn?: string;
  categoryId?: string;
  authorId?: string;
  format?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
  page?: number;
  limit?: number;
}

export class CatalogService {
  private store = BookstoreStore.getInstance();

  getBooks(options: CatalogFilterOptions = {}) {
    const {
      query,
      isbn,
      categoryId,
      authorId,
      format,
      minPrice,
      maxPrice,
      minRating,
      inStockOnly,
      sort = 'featured',
      page = 1,
      limit = 12
    } = options;

    let results = this.store.books.map(b => this.enrichBook(b));

    // 1. ISBN Direct Filter
    if (isbn) {
      const cleanIsbn = isbn.replace(/[-\s]/g, '').toLowerCase();
      results = results.filter(book => 
        book.editions.some((ed: any) => ed.isbn.replace(/[-\s]/g, '').toLowerCase() === cleanIsbn)
      );
    }

    // 2. Query Text Search (Title, Author, Synopsis)
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(book => 
        book.title.toLowerCase().includes(q) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(q)) ||
        book.author.name.toLowerCase().includes(q) ||
        book.synopsis.toLowerCase().includes(q)
      );
    }

    // 3. Category Filter
    if (categoryId) {
      results = results.filter(book => book.categoryId === categoryId);
    }

    // 4. Author Filter
    if (authorId) {
      results = results.filter(book => book.authorId === authorId);
    }

    // 5. Format Filter
    if (format) {
      results = results.filter(book => 
        book.editions.some((ed: any) => ed.format.toUpperCase() === format.toUpperCase())
      );
    }

    // 6. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      results = results.filter(book => {
        const lowestPrice = Math.min(...book.editions.map((e: any) => Number(e.salePrice)));
        if (minPrice !== undefined && lowestPrice < minPrice) return false;
        if (maxPrice !== undefined && lowestPrice > maxPrice) return false;
        return true;
      });
    }

    // 7. Rating Filter
    if (minRating !== undefined && minRating > 0) {
      results = results.filter(book => book.rating >= minRating);
    }

    // 8. Stock Filter
    if (inStockOnly) {
      results = results.filter(book => 
        book.editions.some((ed: any) => ed.stock > 0)
      );
    }

    // 9. Sorting
    switch (sort) {
      case 'price_asc':
        results.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'price_desc':
        results.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case 'rating_desc':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    const totalCount = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      books: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  getBookByIdOrSlug(idOrSlug: string) {
    const book = this.store.books.find(b => b.id === idOrSlug || b.slug === idOrSlug);
    if (!book) return null;
    return this.enrichBook(book);
  }

  findByIsbn(isbn: string) {
    const clean = isbn.replace(/[-\s]/g, '').toLowerCase();
    const edition = this.store.editions.find(
      e => e.isbn.replace(/[-\s]/g, '').toLowerCase() === clean
    );
    if (!edition) return null;

    const book = this.store.findBook(edition.bookId);
    if (!book) return null;

    return {
      edition,
      book: this.enrichBook(book)
    };
  }

  getRecommendations(bookId: string, limit = 4) {
    const sourceBook = this.store.findBook(bookId);
    if (!sourceBook) return [];

    const others = this.store.books.filter(b => b.id !== bookId);

    // Score by same author (+3) or same category (+2)
    const scored = others.map(b => {
      let score = 0;
      if (b.authorId === sourceBook.authorId) score += 3;
      if (b.categoryId === sourceBook.categoryId) score += 2;
      return { book: this.enrichBook(b), score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.book);
  }

  getCategories() {
    return this.store.categories.map(cat => {
      const bookCount = this.store.books.filter(b => b.categoryId === cat.id).length;
      return {
        ...cat,
        bookCount
      };
    });
  }

  getAuthors() {
    return this.store.authors.map(auth => {
      const books = this.store.books.filter(b => b.authorId === auth.id).map(b => this.enrichBook(b));
      return {
        ...auth,
        bookCount: books.length,
        books
      };
    });
  }

  getAuthorById(authorId: string) {
    const author = this.store.findAuthor(authorId);
    if (!author) return null;
    const books = this.store.books.filter(b => b.authorId === author.id).map(b => this.enrichBook(b));
    return {
      ...author,
      books
    };
  }

  private enrichBook(book: any) {
    const author = this.store.findAuthor(book.authorId);
    const publisher = this.store.findPublisher(book.publisherId);
    const category = this.store.findCategory(book.categoryId);
    const editions = this.store.editions.filter(e => e.bookId === book.id);
    const bookReviews = this.store.reviews.filter(r => r.bookId === book.id && r.isApproved);

    const startingPrice = editions.length > 0 
      ? Math.min(...editions.map(e => Number(e.salePrice)))
      : 0;

    const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = bookReviews.length > 0 ? Number((totalRating / bookReviews.length).toFixed(1)) : 4.8; // default editorial rating

    return {
      ...book,
      author: author || { name: 'Unknown Author' },
      publisher: publisher || { name: 'Independent Press' },
      category: category || { name: 'General Fiction' },
      editions,
      startingPrice,
      rating: averageRating,
      reviewCount: bookReviews.length,
      reviews: bookReviews
    };
  }
}
