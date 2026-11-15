'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Home, Grid, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, pendingCount, user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            pathname === '/' ? 'text-cyan-400' : 'hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Discover</span>
        </Link>

        <Link
          href="/cart"
          className={`relative flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            pathname === '/cart' ? 'text-cyan-400' : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-cyan-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>Bag</span>
        </Link>

        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            pathname === '/orders' ? 'text-cyan-400' : 'hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Orders</span>
        </Link>

        <Link
          href="/admin"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            pathname === '/admin' ? 'text-cyan-400' : 'hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      </div>
    </nav>
  );
}
