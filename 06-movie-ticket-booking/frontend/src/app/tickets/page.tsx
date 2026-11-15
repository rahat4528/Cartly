'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Booking, fetchApi } from '../../lib/api';
import { Ticket, Calendar, Clock, Film, QrCode, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

function TicketsWallet() {
  const { user, token, quickSwitch } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchApi<{ bookings: Booking[] }>('/bookings/my-bookings', {}, token)
      .then((data) => setBookings(data.bookings))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Ticket className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Patron Account Required</h2>
        <p className="text-xs text-slate-400">
          Sign in to view your reserved tickets and scannable gate passes.
        </p>
        <button
          onClick={() => quickSwitch('patron')}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg transition-colors"
        >
          Sign in as Demo Patron
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Cinema Ticket Wallet</h1>
          <p className="text-xs text-slate-400 mt-1">
            Present the digital QR pass or ticket code at the usher scanner gate.
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Book More Tickets
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No tickets found</h3>
          <p className="text-xs text-slate-500">You haven&apos;t reserved any movie tickets yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((b) => {
            const isAdmitted = b.status === 'ADMITTED';
            const isConfirmed = b.status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* Ticket Top Banner */}
                <div className="bg-gradient-to-r from-red-950/80 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-red-400 font-bold">
                      {b.bookingRef}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {b.movie?.title || 'Cinema Screening'}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      isAdmitted
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : isConfirmed
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Ticket Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Reserved Seats</span>
                      <span className="font-bold text-amber-400">{b.seats.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Auditorium</span>
                      <span className="font-semibold text-slate-200">
                        {b.auditorium?.name || 'Screen 1 • Dolby Atmos'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Showtime</span>
                      <span className="text-slate-300">
                        {b.showtime?.startTime
                          ? new Date(b.showtime.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Today'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Total Amount</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        ${b.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pass Barcode / QR Section */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Ticket Code (Gate Scan)
                      </span>
                      <span className="font-mono font-bold text-sm text-red-400 tracking-wider">
                        {b.ticketCode}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      <QrCode className="w-8 h-8" />
                    </div>
                  </div>

                  {isAdmitted && (
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Admitted at gate • {new Date(b.admittedAt!).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading tickets...</div>}>
      <TicketsWallet />
    </Suspense>
  );
}
