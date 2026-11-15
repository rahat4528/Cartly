'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Car, Key, ShieldCheck, LogOut, CheckCircle, FileText } from 'lucide-react';

export function Navbar() {
  const { user, logout, quickSwitch, verifyLicense } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Cartly<span className="text-teal-400">Drive</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-teal-400 font-semibold">
                Fleet Rentals & Escrow
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-teal-400 transition-colors">
              Vehicle Fleet
            </Link>
            <Link href="/rentals" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-teal-400" />
              <span>My Rentals</span>
            </Link>
            <Link href="/agent" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Agent Inspection Desk</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200">{user.name}</div>
                <div className="text-[10px] font-mono text-teal-400 uppercase font-semibold flex items-center justify-end space-x-1">
                  <span>{user.role}</span>
                  {user.license?.status === 'VERIFIED' && (
                    <span title="Verified Driver License" className="text-emerald-400">
                      • DL Verified
                    </span>
                  )}
                </div>
              </div>

              {!user.license && (
                <button
                  onClick={() => verifyLicense('DL-99887766-CA', 'California')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-teal-600/30 border border-teal-500 text-teal-300 hover:bg-teal-600/50"
                >
                  Verify License
                </button>
              )}

              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => quickSwitch('renter')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors"
              >
                Renter Sign In
              </button>
              <button
                onClick={() => quickSwitch('agent')}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Agent Desk Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
