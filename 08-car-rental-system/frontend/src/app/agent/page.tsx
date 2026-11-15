'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Rental, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import { ShieldCheck, Car, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle, Key } from 'lucide-react';

function AgentInspectionDesk() {
  const { user, token, quickSwitch } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRentalId, setActiveRentalId] = useState<string | null>(null);

  // Inspection inputs
  const [pickupOdo, setPickupOdo] = useState<number>(18500);
  const [returnOdo, setReturnOdo] = useState<number>(18800);
  const [fuelLevel, setFuelLevel] = useState<string>('FULL');
  const [damageNotes, setDamageNotes] = useState<string>('Clean return, no dents');
  const [damageFee, setDamageFee] = useState<number>(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePickup = async (rentalId: string) => {
    setIsSubmitting(true);
    try {
      await fetchApi(
        `/rentals/${rentalId}/pickup`,
        {
          method: 'POST',
          body: JSON.stringify({ odometer: pickupOdo, fuelLevel }),
        },
        token
      );
      loadRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (rentalId: string) => {
    setIsSubmitting(true);
    try {
      await fetchApi(
        `/rentals/${rentalId}/return`,
        {
          method: 'POST',
          body: JSON.stringify({
            returnOdometer: returnOdo,
            returnFuelLevel: fuelLevel,
            damagesNotes: damageNotes,
            damageFee,
          }),
        },
        token
      );
      // Immediately settle deposit
      await fetchApi(`/rentals/${rentalId}/settle`, { method: 'POST' }, token);
      loadRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAgent = user?.role === 'FLEET_AGENT' || user?.role === 'FLEET_MANAGER';

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-white">Fleet Agent Inspection Desk</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Check in/out inspection protocols, odometer/fuel logging, and damage escrow settlement.
            </p>
          </div>

          {!isAgent && (
            <button
              onClick={() => quickSwitch('agent')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Switch to Agent Role
            </button>
          )}
        </div>

        {/* Operating Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-white">1. Key Handover</span>
            <p>Verify renter DL and record initial odometer reading at pickup.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-white">2. Return Inspection</span>
            <p>Inspect body panels, glass, and fuel level upon vehicle return.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-white">3. Deposit Settlement</span>
            <p>Release $250 escrow deposit minus assessed damages directly to renter.</p>
          </div>
        </div>

        {/* Inspections list */}
        {isLoading ? (
          <div className="h-40 bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
        ) : rentals.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 text-slate-500 space-y-2">
            <Car className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-sm font-semibold">No active fleet agreements queued</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((r) => (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-400">{r.rentalNumber}</span>
                    <span className="text-sm font-bold text-white ml-2">
                      {r.vehicle?.make} {r.vehicle?.model}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                    {r.status}
                  </span>
                </div>

                {/* Agent Action Controls */}
                {r.status === 'RESERVED' && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="number"
                      placeholder="Pickup Odometer"
                      value={pickupOdo}
                      onChange={(e) => setPickupOdo(Number(e.target.value))}
                      className="w-full sm:w-48 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <button
                      disabled={isSubmitting || !isAgent}
                      onClick={() => handlePickup(r.id)}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Dispatch Vehicle (Pickup)</span>
                    </button>
                  </div>
                )}

                {r.status === 'ACTIVE_RENTAL' && (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300">Return & Damage Assessment</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="number"
                        placeholder="Return Odometer"
                        value={returnOdo}
                        onChange={(e) => setReturnOdo(Number(e.target.value))}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Damage Notes (optional)"
                        value={damageNotes}
                        onChange={(e) => setDamageNotes(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Damage Fee ($)"
                        value={damageFee}
                        onChange={(e) => setDamageFee(Number(e.target.value))}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <button
                      disabled={isSubmitting || !isAgent}
                      onClick={() => handleReturn(r.id)}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Return & Settle Escrow Deposit</span>
                    </button>
                  </div>
                )}

                {r.status === 'COMPLETED' && (
                  <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rental closed. Net deposit refunded: ${r.depositRefunded.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading agent desk...</div>}>
      <AgentInspectionDesk />
    </Suspense>
  );
}
