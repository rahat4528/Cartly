'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { ShoppingBag, Truck, ClipboardList, LogOut, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Navbar({ cartCount = 0, onOpenCart }: NavbarProps) {
  const { user, logout, quickSwitch } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Cartly<span className="text-emerald-600">Fresh</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold">
                Organic Supermarket Delivery
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              Market Aisles
            </Link>
            <Link href="/orders" className="hover:text-emerald-600 transition-colors flex items-center space-x-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              <span>Track Orders</span>
            </Link>
            <Link href="/driver" className="hover:text-emerald-600 transition-colors flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-500" />
              <span>Fulfillment Hub</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Cart Drawer Trigger */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user.name}</div>
                <div className="text-[10px] font-mono text-emerald-600 uppercase font-semibold">
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => quickSwitch('customer')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              >
                Customer Sign In
              </button>
              <button
                onClick={() => quickSwitch('driver')}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                Driver Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
