'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Search, ShoppingBag, Heart, Check, Sparkles, Zap, Flame, ShieldAlert } from 'lucide-react';

export default function PwaStoreHome() {
  const { user, token, isOnline, enqueueAction, refreshCart } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/categories');
      setCategories(data);
    } catch {
      // offline cache fallback via service worker
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('query', searchQuery);

      const res = await apiRequest(`/products?${params.toString()}`);
      setProducts(res.products || []);
    } catch {
      // offline cache fallback via service worker
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (product.stock <= 0) {
      setActionFeedback(`"${product.title}" is sold out`);
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }

    if (!isOnline) {
      // Offline mode: Enqueue to client SyncQueue!
      enqueueAction('ADD_TO_CART', {
        productId: product.id,
        quantity: 1,
        expectedPrice: product.price
      });
      setActionFeedback(`Offline: Queued "${product.title}" to background sync queue`);
    } else {
      // Online mode: Call live API
      try {
        await apiRequest('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id, quantity: 1 })
        }, token!);
        await refreshCart();
        setActionFeedback(`Added "${product.title}" to your bag`);
      } catch (err: any) {
        setActionFeedback(err.message);
      }
    }

    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-12 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-800 border border-cyan-500 text-cyan-300 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
            Progressive Web Store
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Cartly Devices</h1>
        </div>
        <InstallPrompt />
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search devices, audio, wearables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition ${
            selectedCategory === ''
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Hero Promo Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-900 via-slate-800 to-slate-900 border border-cyan-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Offline-First Commerce</span>
        </div>
        <h2 className="text-lg font-bold text-white leading-tight mb-2">
          Hardware That Works Anywhere
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          Browse our device catalog and queue additions even on flights or subway tunnels. Synchronization resumes automatically upon reconnection.
        </p>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Hardware Catalog ({products.length})
          </span>
          {!isOnline && (
            <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3" /> Cached Offline
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading device matrix...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl p-6">
            No devices found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => {
              const outOfStock = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between hover:border-cyan-500/50 transition group"
                >
                  <div>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 mb-2">
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {p.isFeatured && (
                        <span className="absolute top-1.5 left-1.5 bg-cyan-500 text-slate-950 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                      {outOfStock ? (
                        <span className="absolute bottom-1.5 left-1.5 bg-rose-950/80 text-rose-300 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-rose-500/30">
                          Out of Stock
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="absolute bottom-1.5 left-1.5 bg-amber-950/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                          {p.stock} Left
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-bold text-xs text-slate-100 line-clamp-1 group-hover:text-cyan-400 transition">
                      {p.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                    <span className="font-bold text-sm text-white">
                      ${Number(p.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={outOfStock}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                        outOfStock
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                      }`}
                      title={isOnline ? 'Add to bag' : 'Queue action offline'}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
