'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  Calendar, MapPin, AlertCircle, CheckCircle2, XCircle,
  Clock, ShieldAlert, ArrowRight, Printer, AlertTriangle
} from 'lucide-react';

function ReservationsContent() {
  const { user, login } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancellingResv, setCancellingResv] = useState<any>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<any>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadReservations = async () => {
    setLoading(true);
    try {
      if (!user) {
        await login('guest@cartly.local', 'Pass123!');
      }
      const res = await fetchApi('/reservations/my-reservations');
      setReservations(res.reservations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [user]);

  const handleCancelClick = (resv: any) => {
    setCancelError(null);
    setCancellationResult(null);
    setCancellingResv(resv);
  };

  const executeCancellation = async () => {
    if (!cancellingResv) return;
    setCancellingLoading(true);
    setCancelError(null);

    try {
      const res = await fetchApi(`/reservations/${cancellingResv.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Trip rescheduled by guest' })
      });
      setCancellationResult(res);
      loadReservations();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'CHECKED_IN':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Checked In</span>;
      case 'COMPLETED':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Stay Completed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'EXPIRED':
        return <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Hold Expired</span>;
      case 'HELD':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Payment</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex justify-between items-center mb-8 border-b border-sand-300 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-900">My Hospitality Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage upcoming stays, print booking vouchers, and review cancellation policies.
          </p>
        </div>
        <Link
          href="/"
          className="bg-navy-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
        >
          Book Another Stay
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading your reservation history...</div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-sand-300 shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-slate-700 mb-1">No Reservations Found</h3>
          <p className="text-xs text-slate-500 mb-6">You have no active stays or holds on file.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs hover:bg-amber-700"
          >
            Explore Hotels
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reservations.map(resv => (
            <div
              key={resv.id}
              className="bg-white rounded-2xl border border-sand-300 p-6 shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={resv.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                    alt={resv.hotelName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(resv.status)}
                    <span className="text-[11px] font-mono font-bold text-slate-400">Voucher: {resv.voucherCode}</span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-navy-900">{resv.hotelName}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {resv.hotelCity} &middot; {resv.roomTypeName} ({resv.roomsCount} {resv.roomsCount === 1 ? 'room' : 'rooms'})
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-sand-50 px-3 py-1.5 rounded-lg border border-sand-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-normal">Check-In</span>
                      {resv.checkInDate}
                    </div>
                    <div className="text-slate-300">&rarr;</div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-normal">Check-Out</span>
                      {resv.checkOutDate}
                    </div>
                    <div className="border-l border-sand-200 pl-3">
                      <span className="text-[10px] uppercase text-slate-400 block font-normal">Stay Duration</span>
                      {resv.nightsCount} {resv.nightsCount === 1 ? 'night' : 'nights'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="w-full md:w-auto text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-sand-200">
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Charged</span>
                  <span className="font-serif font-black text-xl text-navy-900">${resv.totalAmount.toFixed(2)}</span>
                  {resv.refundAmount !== undefined && resv.refundAmount !== null && (
                    <span className="text-[11px] text-emerald-700 block font-bold">
                      Refunded: ${resv.refundAmount.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap md:justify-end gap-2">
                  {resv.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelClick(resv)}
                      className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      Cancel Stay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== CANCELLATION MODAL ==================== */}
      {cancellingResv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sand-300">
            {cancellationResult ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-navy-900 mb-1">Stay Successfully Cancelled</h3>
                <p className="text-xs text-slate-600 mb-4">
                  {cancellationResult.refund?.policyApplied}
                </p>

                <div className="bg-sand-50 rounded-xl p-4 border border-sand-200 text-xs mb-6 text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund Percentage:</span>
                    <span className="font-bold text-slate-800">{cancellationResult.refund?.refundPercentage}%</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-navy-900 border-t border-sand-200 pt-1.5">
                    <span>Net Refund Amount:</span>
                    <span className="text-emerald-700">${cancellationResult.refund?.refundAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCancellingResv(null)}
                  className="bg-navy-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-navy-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="font-serif font-bold text-lg text-navy-900">Cancel Reservation?</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Are you sure you want to cancel your stay at <strong>{cancellingResv.hotelName}</strong> ({cancellingResv.checkInDate} &rarr; {cancellingResv.checkOutDate})?
                </p>

                {/* Refund Policy Matrix Reminder */}
                <div className="bg-sand-100 rounded-xl p-4 border border-sand-300 text-xs mb-4 space-y-2 text-slate-700">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800">Hospitality Refund Policy:</div>
                  <div className="flex justify-between border-b border-sand-200 pb-1">
                    <span>&gt; 48 hours before 15:00 check-in:</span>
                    <span className="font-bold text-emerald-700">100% Full Refund</span>
                  </div>
                  <div className="flex justify-between border-b border-sand-200 pb-1">
                    <span>24 to 48 hours before check-in:</span>
                    <span className="font-bold text-amber-700">50% Partial Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&lt; 24 hours before check-in:</span>
                    <span className="font-bold text-rose-700">0% Non-refundable</span>
                  </div>
                </div>

                {cancelError && (
                  <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-lg mb-4">
                    {cancelError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    disabled={cancellingLoading}
                    onClick={() => setCancellingResv(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Keep Reservation
                  </button>
                  <button
                    disabled={cancellingLoading}
                    onClick={executeCancellation}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {cancellingLoading ? 'Processing Cancellation...' : 'Confirm Cancellation'}
                  </button>
                </div>
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading reservations...</div>}>
      <ReservationsContent />
    </Suspense>
  );
}
