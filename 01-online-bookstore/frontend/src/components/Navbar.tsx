'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BookOpen, ShoppingBag, Heart, User, ShieldCheck, Search, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, cartCount, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const switchAccount = async (role: 'CUSTOMER' | 'ADMIN') => {
    if (role === 'ADMIN') {
      await login('admin@cartly.local', 'AdminPass123!');
      router.push('/admin');
    } else {
      await login('customer@cartly.local', 'Pass123!');
      router.push('/');
    }
  };

  return (
    <header className="border-b border-parchment-300 bg-parchment-50 sticky top-0 z-50">
      {/* Top Banner */}
      <div className="bg-parchment-800 text-parchment-100 px-4 py-1.5 text-xs flex justify-between items-center tracking-wider">
        <div className="flex items-center space-x-4">
          <span>Complimentary shipping on fine editions over $50</span>
          <span className="text-editorial-amber">Use code: EDITORIAL15 for 15% off</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">Demo Role:</span>
          {user?.role === 'ADMIN' ? (
            <button 
              onClick={() => switchAccount('CUSTOMER')}
              className="text-editorial-amber hover:underline flex items-center gap-1 font-sans"
            >
              <User className="w-3 h-3" /> Switch to Customer
            </button>
          ) : (
            <button 
              onClick={() => switchAccount('ADMIN')}
              className="text-editorial-amber hover:underline flex items-center gap-1 font-sans"
            >
              <ShieldCheck className="w-3 h-3" /> Switch to Admin
            </button>
          )}
        </div>
      </div>

      {/* Main Editorial Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Tagline */}
          <Link href="/" className="group inline-block">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded border border-parchment-800 flex items-center justify-center bg-parchment-100 group-hover:bg-parchment-200 transition">
                <BookOpen className="w-6 h-6 text-parchment-900" />
              </div>
              <div>
                <h1 className="text-2xl font-serif tracking-widest text-parchment-900 font-bold uppercase">
                  Cartly Bookstore
                </h1>
                <p className="text-xs font-serif italic text-gray-600 tracking-wider">
                  Est. 2026 &bull; Curated Editions, Fine Letters &amp; Literary Works
                </p>
              </div>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search by Title, Author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-parchment-100 border border-parchment-300 rounded px-4 py-2 pl-10 text-sm focus:outline-none focus:border-editorial-burgundy transition"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <button type="submit" className="sr-only">Search</button>
          </form>

          {/* Actions & Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/orders" className="text-sm text-parchment-900 hover:text-editorial-burgundy transition font-serif flex items-center gap-1.5">
              <span>My Orders</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-sm font-semibold text-editorial-burgundy hover:text-red-900 transition flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Suite</span>
              </Link>
            )}

            <Link href="/cart" className="relative text-parchment-900 hover:text-editorial-burgundy transition p-1">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-editorial-burgundy text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-sans font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2 text-xs text-gray-600 font-sans border-l border-parchment-300 pl-4">
                <span>{user.firstName} ({user.role})</span>
                <button onClick={logout} title="Sign Out" className="text-gray-400 hover:text-gray-700">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => switchAccount('CUSTOMER')}
                className="text-xs uppercase tracking-wider font-semibold hover:underline"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Secondary Category Navigation */}
        <nav className="mt-4 pt-3 border-t border-parchment-200 flex space-x-8 text-xs tracking-widest uppercase font-sans text-gray-700 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-editorial-burgundy whitespace-nowrap">All Literature</Link>
          <Link href="/?categoryId=cat_001" className="hover:text-editorial-burgundy whitespace-nowrap">Literary Fiction</Link>
          <Link href="/?categoryId=cat_002" className="hover:text-editorial-burgundy whitespace-nowrap">Speculative &amp; Sci-Fi</Link>
          <Link href="/?categoryId=cat_003" className="hover:text-editorial-burgundy whitespace-nowrap">Philosophy &amp; Essays</Link>
          <Link href="/?categoryId=cat_004" className="hover:text-editorial-burgundy whitespace-nowrap">History &amp; Science</Link>
          <Link href="/?categoryId=cat_005" className="hover:text-editorial-burgundy whitespace-nowrap">Poetry</Link>
        </nav>
      </div>
    </header>
  );
}
