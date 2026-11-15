'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Rental, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import {
  Key,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  CheckCircle2,
  Lock,
  Car
} from 'lucide-react';

function RentalsWallet() {
  const { user, token, quickSwitch } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRentals = () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchApi<{ rentals: Rental[] }>('/rentals/my-rentals', {}, token)
      .then((data) => setRentals(data.rentals))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRentals();
  }, [token]);

  const handleCancelRental = async (rentalId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? Full payment and security deposit will be refunded.')) {
      return;
    }
    setCancellingId(rentalId);
    try {
      await fetchApi(`/rentals/${rentalId}/cancel`, { method: 'POST' }, token);
      loadRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <Key className="w-12 h-12 text-teal-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Sign In to View Rental Agreements</h2>
          <p className="text-xs text-slate-400">
            Access your active vehicle reservations, digital keys, and security deposit escrow refunds.
          </p>
          <button
            onClick={() => quickSwitch('renter')}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Sign in as Demo Renter
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Rental Agreements</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active reservations, return inspection sheets, and escrow refund statements.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Reserve Another Vehicle
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Car className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Rental Agreements</h3>
            <p className="text-xs text-slate-500">You do not have any vehicle rentals on file.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rentals.map((r) => {
              const isCancelled = r.status === 'CANCELLED';
              const isCompleted = r.status === 'COMPLETED';

              return (
                <div
                  key={r.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-teal-400 font-bold">
                        {r.rentalNumber}
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.year})
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          isCancelled
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-teal-950 text-teal-300 border border-teal-800'
                        }`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>

                      {r.status === 'RESERVED' && (
                        <button
                          disabled={cancellingId === r.id}
                          onClick={() => handleCancelRental(r.id)}
                          className="px-3 py-1 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950 border border-red-800 transition-colors"
                        >
                          {cancellingId === r.id ? 'Cancelling...' : 'Cancel Reservation'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Rental Window</span>
                      <span className="font-bold text-slate-200">
                        {r.startDate} &rarr; {r.endDate} ({r.totalDays}d)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Daily Rate Charged</span>
                      <span className="font-bold text-teal-400">${r.dailyRateApplied.toFixed(2)}/day</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Security Deposit Escrow</span>
                      <span className="font-bold text-cyan-300">${r.securityDepositAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Charged</span>
                      <span className="font-mono font-bold text-emerald-400">${r.totalCharged.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Return Inspection Details */}
                  {r.inspection && (
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                      <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span>Vehicle Inspection Sheet</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 text-[11px]">
                        <div>
                          <span>Pickup Odometer:</span> <span className="font-mono text-white">{r.inspection.pickupOdometer} mi</span>
                        </div>
                        <div>
                          <span>Return Odometer:</span>{' '}
                          <span className="font-mono text-white">
                            {r.inspection.returnOdometer ? `${r.inspection.returnOdometer} mi` : 'Pending'}
                          </span>
                        </div>
                        <div>
                          <span>Fuel Level:</span> <span className="text-white">{r.inspection.returnFuelLevel || r.inspection.pickupFuelLevel}</span>
                        </div>
                        <div>
                          <span>Damage Assessed:</span>{' '}
                          <span className="font-bold text-amber-400">${r.damageDeduction.toFixed(2)}</span>
                        </div>
                      </div>
                      {r.depositRefunded > 0 && (
                        <div className="pt-2 border-t border-slate-800 text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Deposit Escrow Refunded: ${r.depositRefunded.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function RentalsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading rentals...</div>}>
      <RentalsWallet />
    </Suspense>
  );
}
