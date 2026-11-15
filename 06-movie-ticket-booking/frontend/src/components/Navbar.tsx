'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Film, Ticket, ShieldCheck, UserCircle, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout, quickSwitch } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-red-400 bg-clip-text text-transparent">
                Cartly Cinema
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-red-400">
                Ticket & Seat Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
            >
              <span>Now Showing</span>
            </Link>
            <Link
              href="/tickets"
              className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>My Tickets</span>
            </Link>
            <Link
              href="/usher"
              className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Usher Gate</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => quickSwitch('patron')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm"
              >
                Sign in (Patron)
              </button>
              <button
                onClick={() => quickSwitch('usher')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Usher Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
