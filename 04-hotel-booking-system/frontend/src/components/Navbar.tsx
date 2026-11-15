'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Building, Calendar, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, switchDemoUser } = useAuth();

  return (
    <nav className="bg-white border-b border-sand-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center text-amber-400 font-serif font-black text-xl shadow-xs">
                C
              </span>
              <div>
                <span className="text-xl font-serif font-bold text-navy-900 tracking-tight">Cartly</span>
                <span className="text-xs uppercase tracking-widest text-amber-700 ml-1.5 font-semibold">Hospitality</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
              <Link href="/" className="hover:text-navy-900 transition-colors">
                Destinations & Hotels
              </Link>
              <Link href="/reservations" className="hover:text-navy-900 transition-colors flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                My Reservations
              </Link>
              {user?.role === 'HOTELIER' && (
                <Link href="/hotelier" className="text-amber-800 font-semibold hover:text-navy-900 transition-colors flex items-center gap-1">
                  <Building className="w-4 h-4 text-amber-700" />
                  Hotelier Portal
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="hidden lg:flex items-center bg-sand-100 rounded-lg p-1 text-xs border border-sand-300">
              <span className="text-slate-500 px-2 font-medium">Demo:</span>
              <button
                onClick={() => switchDemoUser('GUEST')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'GUEST' ? 'bg-white shadow-xs font-bold text-navy-900' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => switchDemoUser('HOTELIER')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'HOTELIER' ? 'bg-white shadow-xs font-bold text-amber-800' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Hotelier
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-navy-900">{user.name}</div>
                  <div className="text-[10px] uppercase font-semibold text-amber-700 tracking-wider">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-50"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => switchDemoUser('GUEST')}
                className="inline-flex items-center gap-1.5 bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors"
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
