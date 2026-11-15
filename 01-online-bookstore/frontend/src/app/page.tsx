'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookOpen, Star, ShoppingBag, Check, Filter, Sparkles } from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();
  const { user, token, refreshCartCount } = useAuth();

  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [addingEditionId, setAddingEditionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const query = searchParams.get('query') || '';
  const categoryId = searchParams.get('categoryId') || '';

  useEffect(() => {
    fetchCatalog();
    fetchCategories();
  }, [query, categoryId, selectedFormat, minRating, inStockOnly, sortBy]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/catalog/categories');
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId) params.append('categoryId', categoryId);
      if (selectedFormat) params.append('format', selectedFormat);
      if (minRating > 0) params.append('minRating', String(minRating));
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await apiRequest(`/catalog/books?${params.toString()}`);
      setBooks(res.books || []);
    } catch (err: any) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (editionId: string) => {
    if (!token) {
      setFeedbackMsg('Please sign in to add books to your shopping cart.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    setAddingEditionId(editionId);
    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ editionId, quantity: 1 })
      }, token);
      await refreshCartCount();
      setFeedbackMsg('Added edition to your shopping bag.');
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Failed to add item');
    } finally {
      setAddingEditionId(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-serif">
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-parchment-900 text-parchment-100 px-5 py-3 rounded shadow-xl flex items-center gap-2 font-sans text-sm border border-editorial-amber">
          <Sparkles className="w-4 h-4 text-editorial-amber" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Hero Editorial Banner (when no query active) */}
      {!query && !categoryId && (
        <div className="border border-parchment-300 bg-parchment-100 p-8 md:p-12 mb-12 rounded-sm shadow-sm">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest font-sans font-bold text-editorial-burgundy">
              The Seasonal Collection &bull; Autumn 2026
            </span>
            <h2 className="text-3xl md:text-5xl font-serif mt-2 mb-4 text-parchment-900 leading-tight">
              Literature that endures beyond the passing hour.
            </h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-sans mb-6">
              Explore meticulously curated prose, speculative cartographies, and historical treatises published in archival hardcovers and signed deluxe pressings.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-sans">
              <span className="bg-parchment-200 px-3 py-1.5 rounded border border-parchment-300">Acid-free binding</span>
              <span className="bg-parchment-200 px-3 py-1.5 rounded border border-parchment-300">Verified reader reviews</span>
              <span className="bg-parchment-200 px-3 py-1.5 rounded border border-parchment-300">Audited inventory movements</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-parchment-200">
        <div>
          <h2 className="text-2xl font-serif font-bold text-parchment-900">
            {query ? `Search Results for "${query}"` : categoryId ? 'Filtered Category' : 'The Library Archive'}
          </h2>
          <p className="text-xs font-sans text-gray-500 mt-1">
            Displaying {books.length} curated literary works
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 font-sans text-xs">
          <div className="flex items-center gap-1 bg-parchment-100 border border-parchment-300 px-2 py-1 rounded">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-transparent focus:outline-none"
            >
              <option value="">All Formats</option>
              <option value="PAPERBACK">Paperback</option>
              <option value="HARDCOVER">Hardcover</option>
              <option value="DELUXE">Deluxe Edition</option>
              <option value="EBOOK">E-Book</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-parchment-100 border border-parchment-300 px-2 py-1 rounded">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none"
            >
              <option value="featured">Featured Curations</option>
              <option value="newest">Recently Published</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer bg-parchment-100 border border-parchment-300 px-2 py-1 rounded select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-editorial-burgundy focus:ring-0"
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="py-20 text-center font-sans text-gray-500">
          <BookOpen className="w-8 h-8 animate-pulse mx-auto mb-2 text-editorial-amber" />
          <p>Consulting catalog archives...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-parchment-300 rounded p-8">
          <p className="text-lg font-serif text-gray-700">No books found matching your literary criteria.</p>
          <Link href="/" className="inline-block mt-4 text-xs font-sans uppercase tracking-widest text-editorial-burgundy font-bold hover:underline">
            Clear all filters &amp; view entire catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {books.map((book) => {
            const defaultEdition = book.editions?.[0] || {};
            const isOutOfStock = defaultEdition.stock <= 0;

            return (
              <div
                key={book.id}
                className="group border border-parchment-300 bg-white p-4 rounded-sm flex flex-col justify-between hover:shadow-md hover:border-parchment-800 transition"
              >
                <div>
                  {/* Book Cover Frame */}
                  <Link href={`/books/${book.slug || book.id}`} className="block relative overflow-hidden bg-parchment-100 aspect-[2/3] rounded-sm mb-4">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {book.featured && (
                      <span className="absolute top-2 left-2 bg-editorial-burgundy text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-sans font-bold shadow-sm">
                        Curator Pick
                      </span>
                    )}
                    {defaultEdition.stock > 0 && defaultEdition.stock <= 5 && (
                      <span className="absolute bottom-2 left-2 bg-editorial-amber text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded shadow-sm">
                        Only {defaultEdition.stock} left
                      </span>
                    )}
                  </Link>

                  {/* Title & Author */}
                  <span className="text-[11px] uppercase tracking-wider font-sans text-editorial-burgundy font-semibold">
                    {book.category?.name || 'Literature'}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-parchment-900 group-hover:text-editorial-burgundy transition line-clamp-2 mt-0.5">
                    <Link href={`/books/${book.slug || book.id}`}>
                      {book.title}
                    </Link>
                  </h3>
                  <p className="text-xs font-sans italic text-gray-600 mt-1">
                    By {book.author?.name}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-sans text-gray-600">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(book.rating) ? 'fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span>{book.rating}</span>
                    <span className="text-gray-400">({book.reviewCount} verified)</span>
                  </div>

                  {/* Format & Editions Preview */}
                  <div className="mt-3 flex flex-wrap gap-1 text-[10px] font-sans">
                    {book.editions?.map((ed: any) => (
                      <span
                        key={ed.id}
                        className={`px-1.5 py-0.5 rounded border ${
                          ed.stock > 0 
                            ? 'bg-parchment-50 border-parchment-200 text-gray-700' 
                            : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                        }`}
                        title={`ISBN: ${ed.isbn} | Stock: ${ed.stock}`}
                      >
                        {ed.format}: ${Number(ed.salePrice).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Price & Add to Cart */}
                <div className="mt-5 pt-3 border-t border-parchment-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-sans text-gray-500 block">From</span>
                    <span className="font-serif font-bold text-base text-parchment-900">
                      ${book.startingPrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    disabled={isOutOfStock || addingEditionId === defaultEdition.id}
                    onClick={() => handleAddToCart(defaultEdition.id)}
                    className={`text-xs font-sans uppercase tracking-wider font-bold px-3 py-2 rounded flex items-center gap-1.5 transition ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-parchment-900 text-parchment-50 hover:bg-editorial-burgundy'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Sold Out' : addingEditionId === defaultEdition.id ? 'Adding...' : 'Add'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans text-gray-400">Opening library archive...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
