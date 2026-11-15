'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Building2, Compass, Briefcase, LogOut, Calendar } from 'lucide-react';

export function Navbar() {
  const { user, logout, quickSwitch } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Cartly<span className="text-amber-600">Realty</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-amber-600 font-bold">
                Spatial Property Marketplace
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-amber-600 transition-colors flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Explore Map & Homes</span>
            </Link>
            <Link href="/agent" className="hover:text-amber-600 transition-colors flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <span>Agent Portal</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] font-mono text-amber-600 uppercase font-semibold">
                  {user.role} {user.licenseNo ? `• ${user.licenseNo}` : ''}
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
                onClick={() => quickSwitch('buyer')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
              >
                Buyer Sign In
              </button>
              <button
                onClick={() => quickSwitch('agent')}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                Agent Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
