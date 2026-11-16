'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Compass, Sparkles, User, Home, Heart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, quickSwitch } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-rose-500 text-white p-2.5 rounded-full shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-rose-500">Cartly<span className="text-neutral-900">Stays</span></span>
            <span className="block text-[10px] uppercase font-semibold text-neutral-400 -mt-1 tracking-wider">Accommodation Marketplace</span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-800 hover:text-rose-500 transition"
          >
            Explore Stays
          </Link>
          <Link
            href="/host"
            className="text-sm font-semibold text-neutral-600 hover:text-rose-500 transition flex items-center gap-1.5"
          >
            <Home className="w-4 h-4 text-rose-500" />
            <span>Switch to Hosting</span>
          </Link>
        </nav>

        {/* Persona Switcher & User Pill */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-neutral-100 rounded-full p-1 border border-neutral-200">
            <button
              onClick={() => quickSwitch('GUEST')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                user?.role === 'GUEST'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Guest
            </button>
            <button
              onClick={() => quickSwitch('HOST')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                user?.role === 'HOST'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Host
            </button>
          </div>

          <div className="flex items-center gap-2 border border-neutral-300 rounded-full py-1.5 px-3 hover:shadow-xs transition">
            <div className="w-7 h-7 bg-neutral-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <span className="text-xs font-semibold text-neutral-700 hidden sm:inline">{user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
