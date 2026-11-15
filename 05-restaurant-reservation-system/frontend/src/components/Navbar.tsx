'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Utensils, Calendar, Users, LogOut, UserCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, switchDemoUser } = useAuth();

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-9 h-9 bg-wine-900 rounded-lg flex items-center justify-center text-amber-300 font-serif font-black text-xl shadow-xs">
                C
              </span>
              <div>
                <span className="text-xl font-serif font-bold text-stone-900 tracking-tight">Cartly</span>
                <span className="text-xs uppercase tracking-widest text-wine-700 ml-1.5 font-semibold">Dining</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-700">
              <Link href="/" className="hover:text-wine-900 transition-colors">
                Explore Restaurants
              </Link>
              <Link href="/reservations" className="hover:text-wine-900 transition-colors flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-400" />
                My Dining Reservations
              </Link>
              {user?.role === 'HOST' && (
                <Link href="/host" className="text-wine-800 font-semibold hover:text-wine-900 transition-colors flex items-center gap-1">
                  <Utensils className="w-4 h-4 text-wine-700" />
                  Maitre D' & Host Portal
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo Role Switcher */}
            <div className="hidden lg:flex items-center bg-stone-100 rounded-lg p-1 text-xs border border-stone-300">
              <span className="text-stone-500 px-2 font-medium">Demo:</span>
              <button
                onClick={() => switchDemoUser('DINER')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'DINER' ? 'bg-white shadow-xs font-bold text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Diner
              </button>
              <button
                onClick={() => switchDemoUser('HOST')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'HOST' ? 'bg-white shadow-xs font-bold text-wine-800' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Host
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-stone-900">{user.name}</div>
                  <div className="text-[10px] uppercase font-semibold text-wine-700 tracking-wider">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-stone-50"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => switchDemoUser('DINER')}
                className="inline-flex items-center gap-1.5 bg-wine-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-wine-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Sign In (Demo)
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
