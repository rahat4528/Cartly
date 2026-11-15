'use client';

import React from 'react';
import Link from 'next/link';
import { Home, KeyRound, Wrench, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function Navbar() {
  const { user, login } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Cartly Living</span>
            <span className="text-xs block text-indigo-400 font-mono">House Rental Platform</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-300 hover:text-white transition">
            Explore Rentals
          </Link>
          <Link href="/tenant" className="text-slate-300 hover:text-white transition flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-indigo-400" />
            Tenant Portal
          </Link>
          <Link href="/landlord" className="text-slate-300 hover:text-white transition flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Landlord Portal
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span>{user ? user.fullName : 'Guest'}</span>
            <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
              {user?.role || 'VIEWER'}
            </span>
          </div>

          <div className="flex gap-1 text-xs">
            <button
              onClick={() => login('tenant@example.com')}
              className={`px-2 py-1 rounded transition ${user?.role === 'TENANT' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Tenant
            </button>
            <button
              onClick={() => login('landlord@example.com')}
              className={`px-2 py-1 rounded transition ${user?.role === 'LANDLORD' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Landlord
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
