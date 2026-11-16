'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Plane, AlertTriangle, ShieldCheck, Ticket } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Prominent Demonstration Header Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Demonstration Flight Inventory Only — Not a Commercial Airline or Legal Ticket Issuer</span>
      </div>

      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="bg-sky-600 text-white p-2 rounded-xl shadow-xs">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">Cartly<span className="text-sky-600">Flights</span></span>
              <span className="block text-[10px] uppercase font-bold text-slate-400 -mt-1 tracking-wider">Flight Itinerary & Booking</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Demo Environment
            </span>

            <div className="flex items-center gap-2 border border-slate-200 rounded-full py-1.5 px-3.5 bg-slate-50">
              <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name[0] : 'P'}
              </div>
              <span className="text-xs font-bold text-slate-700">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
