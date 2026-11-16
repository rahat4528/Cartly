'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Heart, User, Sparkles, Building, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function Navbar() {
  const { user, login } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-rose-500 font-extrabold text-xl tracking-tight">
          <Compass className="h-7 w-7 text-rose-500 stroke-[2.5]" />
          <span>Cartly Stays</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-700">
          <Link href="/" className="hover:text-neutral-900 transition flex items-center gap-1.5">
            <Compass className="h-4 w-4" />
            Explore Stays
          </Link>
          <Link href="/trips" className="hover:text-neutral-900 transition flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Trips & Stays
          </Link>
          <Link href="/host" className="hover:text-neutral-900 transition flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            Host Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200 text-xs">
            <User className="h-3.5 w-3.5 text-neutral-600" />
            <span className="font-semibold text-neutral-800">{user ? user.name : 'Guest'}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase">
              {user?.role || 'GUEST'}
            </span>
          </div>

          <div className="flex gap-1 text-xs">
            <button
              onClick={() => login('guest@example.com')}
              className={`px-2.5 py-1 rounded-full transition font-semibold ${user?.role === 'GUEST' ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              Guest
            </button>
            <button
              onClick={() => login('host@example.com')}
              className={`px-2.5 py-1 rounded-full transition font-semibold ${user?.role === 'HOST' ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              Host
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
