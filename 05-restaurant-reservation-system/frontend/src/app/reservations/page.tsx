'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  Calendar, Clock, MapPin, Users, Utensils, CheckCircle2,
  XCircle, AlertCircle, Bell, Sparkles, ArrowRight
} from 'lucide-react';

function ReservationsContent() {
  const { user, login } = useAuth();
  const [data, setData] = useState<{ reservations: any[]; waitlist: any[] }>({
    reservations: [],
    waitlist: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) {
        await login('diner@cartly.local', 'Pass123!');
      }
      const res = await fetchApi('/reservations/my-reservations');
      setData({
        reservations: res.reservations || [],
        waitlist: res.waitlist || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCancelReservation = async (resvId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? This will immediately release your table to waitlisted diners.')) return;
    setActionLoading(resvId);
    try {
      await fetchApi(`/reservations/${resvId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Diner cancellation' })
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimWaitlist = async (waitlistId: string) => {
    setActionLoading(waitlistId);
    try {
      await fetchApi(`/waitlist/${waitlistId}/claim`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to claim promoted reservation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'SEATED':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Seated & Dining</span>;
      case 'COMPLETED':
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'NO_SHOW':
        return <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">No-Show</span>;
      case 'PROMOTED':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3" /> Table Promoted!</span>;
      default:
        return <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex justify-between items-center mb-8 border-b border-stone-300 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">My Dining Reservations</h1>
          <p className="text-xs text-stone-500 mt-1">
            Confirmed dining bookings, seating zones, and active automated waitlist tickets.
          </p>
        </div>
        <Link
          href="/"
          className="bg-wine-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-wine-800 transition-colors"
        >
          Book Another Table
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">Loading your dining history...</div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Promoted / Active Waitlist Tickets */}
          {data.waitlist.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-wine-800 mb-3 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                Active Automated Waitlist Entries ({data.waitlist.length})
              </h2>
              <div className="space-y-3">
                {data.waitlist.map(w => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      w.status === 'PROMOTED'
                        ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(w.status)}
                        <span className="font-serif font-bold text-stone-900 text-base">{w.restaurantName}</span>
                      </div>
                      <div className="text-xs text-stone-500">
                        Requested: {w.reservationDate} at <strong>{w.preferredTimeSlot}</strong> &middot; Party of {w.partySize} &middot; Queue Position #{w.priorityIndex}
                      </div>
                    </div>

                    {w.status === 'PROMOTED' && (
                      <button
                        disabled={actionLoading === w.id}
                        onClick={() => handleClaimWaitlist(w.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === w.id ? 'Claiming Table...' : 'Claim Promoted Table (15 min)'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Confirmed Table Reservations */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Confirmed Reservations ({data.reservations.length})
            </h2>

            {data.reservations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-300 shadow-xs">
                <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-stone-700 mb-1">No Reservations Found</h3>
                <p className="text-xs text-stone-500 mb-6">You have no upcoming dining reservations on file.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 bg-wine-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs hover:bg-wine-800"
                >
                  Explore Restaurants
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.reservations.map(resv => (
                  <div
                    key={resv.id}
                    className="bg-white rounded-2xl border border-stone-300 p-6 shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={resv.restaurantImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                          alt={resv.restaurantName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(resv.status)}
                          <span className="text-[11px] font-mono font-bold text-stone-400">Code: {resv.reservationCode}</span>
                        </div>

                        <h3 className="font-serif font-bold text-lg text-stone-900">{resv.restaurantName}</h3>
                        <div className="text-xs text-stone-500 flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {resv.restaurantAddress}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                          <div>
                            <span className="text-[10px] uppercase text-stone-400 block font-normal">Date & Time</span>
                            {resv.reservationDate} at {resv.timeSlot}
                          </div>
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[10px] uppercase text-stone-400 block font-normal">Party Size</span>
                            {resv.partySize} Diners
                          </div>
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[10px] uppercase text-stone-400 block font-normal">Assigned Table(s)</span>
                            {resv.tableNumbers?.join(' + ') || 'Allocated'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-auto text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-stone-200 flex flex-col justify-between">
                      {resv.status === 'CONFIRMED' && (
                        <button
                          disabled={actionLoading === resv.id}
                          onClick={() => handleCancelReservation(resv.id)}
                          className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                        >
                          {actionLoading === resv.id ? 'Cancelling...' : 'Cancel Reservation'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading dining reservations...</div>}>
      <ReservationsContent />
    </Suspense>
  );
}
