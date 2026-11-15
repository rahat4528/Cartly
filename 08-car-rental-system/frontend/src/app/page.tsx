'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Vehicle, RentalQuote, Rental, fetchApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import {
  Car,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Fuel,
  Users,
  Settings,
  CreditCard,
  Lock,
  X,
  FileCheck2
} from 'lucide-react';

function FleetStorefront() {
  const router = useRouter();
  const { user, token, quickSwitch, verifyLicense } = useAuth();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const fourDaysLater = new Date();
  fourDaysLater.setDate(fourDaysLater.getDate() + 5);
  const fourDaysLaterStr = fourDaysLater.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState<string>(tomorrowStr);
  const [returnDate, setReturnDate] = useState<string>(fourDaysLaterStr);
  const [category, setCategory] = useState<string>('ALL');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reservation modal state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [quote, setQuote] = useState<RentalQuote | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRental, setSuccessRental] = useState<Rental | null>(null);

  const categories = ['ALL', 'ELECTRIC', 'LUXURY', 'SUV', 'COMPACT'];

  // Load vehicles
  const loadFleet = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (category !== 'ALL') params.set('category', category);
    if (pickupDate && returnDate) {
      params.set('pickupDate', pickupDate);
      params.set('returnDate', returnDate);
    }

    fetchApi<{ vehicles: Vehicle[] }>(`/vehicles?${params.toString()}`)
      .then((data) => setVehicles(data.vehicles))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadFleet();
  }, [category, pickupDate, returnDate]);

  // Fetch quote when vehicle or insurance changes
  useEffect(() => {
    if (!selectedVehicle || !pickupDate || !returnDate) {
      setQuote(null);
      return;
    }

    fetchApi<{ quote: RentalQuote }>('/rentals/quote', {
      method: 'POST',
      body: JSON.stringify({
        dailyRate: selectedVehicle.dailyRate,
        startDate: pickupDate,
        endDate: returnDate,
        includeInsurance,
      }),
    })
      .then((data) => setQuote(data.quote))
      .catch((err) => console.error(err));
  }, [selectedVehicle, pickupDate, returnDate, includeInsurance]);

  // Execute reservation
  const handleReserve = async (cardToken: string = 'tok_visa_success') => {
    if (!user) {
      alert('Please sign in as a renter.');
      await quickSwitch('renter');
      return;
    }
    if (!selectedVehicle) return;

    if (!user.license || user.license.status !== 'VERIFIED') {
      await verifyLicense('DL-DEMO9988-CA', 'California');
    }

    setIsReserving(true);
    setErrorMsg(null);

    try {
      const res = await fetchApi<{ rental: Rental }>(
        '/rentals',
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: selectedVehicle.id,
            startDate: pickupDate,
            endDate: returnDate,
            includeInsurance,
            cardToken,
          }),
        },
        token
      );

      setSuccessRental(res.rental);
      setSelectedVehicle(null);
      loadFleet();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Marquee */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 border border-slate-800 text-white p-8 sm:p-12 shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Escrow Protection & Guaranteed Fleet Availability</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Premium Vehicle Fleet Rentals.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Weekly 15% & monthly 30% duration discounts, strict date-overlap locking, and refundable security deposit returns.
            </p>
          </div>
        </div>

        {/* Success Confirmation Modal */}
        {successRental && (
          <div className="bg-slate-900 border border-teal-500/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-teal-300">
              <CheckCircle2 className="w-8 h-8 text-teal-400" />
              <div>
                <h3 className="text-xl font-extrabold text-white">Rental Agreement Confirmed!</h3>
                <p className="text-xs text-slate-400">
                  Agreement Number: <span className="font-mono text-teal-400 font-bold">{successRental.rentalNumber}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Dates</span>
                <span className="font-bold text-white">
                  {successRental.startDate} &rarr; {successRental.endDate} ({successRental.totalDays}d)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-teal-400 uppercase">{successRental.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Security Deposit Escrow</span>
                <span className="font-bold text-cyan-300">${successRental.securityDepositAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Authorized</span>
                <span className="font-bold text-emerald-400">${successRental.totalCharged.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/rentals')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md"
              >
                View in Rental Wallet
              </button>
              <button
                onClick={() => setSuccessRental(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Browse Fleet
              </button>
            </div>
          </div>
        )}

        {/* Date Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-teal-400" />
                <span>Pickup Date</span>
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>Return Date</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  category === cat
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Fleet Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-96 bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((v) => {
              const isAvailable = v.isAvailableForDates !== false;

              return (
                <div
                  key={v.id}
                  className={`bg-slate-900 rounded-3xl overflow-hidden border transition-all flex flex-col justify-between shadow-xl ${
                    isAvailable ? 'border-slate-800 hover:border-teal-500/50' : 'border-slate-800/60 opacity-60'
                  }`}
                >
                  <div>
                    {/* Vehicle Hero Image */}
                    <div className="relative h-56 bg-slate-950 overflow-hidden">
                      <img
                        src={v.imageUrl}
                        alt={`${v.make} ${v.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-[10px] font-bold text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                        {v.category}
                      </span>
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isAvailable
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-950/80 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isAvailable ? 'Available' : 'Booked on Dates'}
                      </span>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-6 space-y-3">
                      <div>
                        <div className="text-xs font-mono text-slate-400">{v.year} Model</div>
                        <h3 className="text-xl font-bold text-white mt-0.5">
                          {v.make} {v.model}
                        </h3>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          <span>{v.seats} Seats</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Settings className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{v.transmission}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {v.fuelType === 'ELECTRIC' ? (
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{v.fuelType}</span>
                        </span>
                      </div>

                      {/* Feature Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {v.features.map((feat) => (
                          <span
                            key={feat}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Footer */}
                  <div className="p-6 pt-0 border-t border-slate-800/60 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-white">${v.dailyRate.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 ml-1">/day</span>
                      <div className="text-[10px] text-teal-400 font-semibold">
                        Weekly: ${(v.dailyRate * 0.85).toFixed(2)}/day (15% off)
                      </div>
                    </div>

                    <button
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedVehicle(v);
                        setErrorMsg(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-md shadow-teal-900/30"
                    >
                      {isAvailable ? 'Reserve Car' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reservation Drawer / Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2.5">
                  <Car className="w-5 h-5 text-teal-400" />
                  <h2 className="text-lg font-bold text-white">
                    Reserve {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Trip Dates Summary */}
              <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Trip Schedule</div>
                <div className="flex justify-between text-slate-200 font-mono">
                  <span>Pickup: {pickupDate}</span>
                  <span>&rarr;</span>
                  <span>Return: {returnDate}</span>
                </div>
                <div className="text-[11px] text-teal-400 font-semibold">
                  Duration: {quote?.totalDays || 1} Days
                  {quote && quote.discountPct > 0 && (
                    <span> • {(quote.discountPct * 100).toFixed(0)}% Duration Discount Applied!</span>
                  )}
                </div>
              </div>

              {/* Insurance Option */}
              <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Collision Damage Waiver (CDW)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Full coverage against collision damage, theft, and vandalism ($19.99/day).
                </p>
              </div>

              {/* Security Deposit Note */}
              <div className="mt-4 bg-teal-950/30 border border-teal-900/60 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-teal-400 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>$250.00 Refundable Security Deposit</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authorized in escrow upon booking and released back to your card immediately upon return inspection.
                </p>
              </div>
            </div>

            {/* Pricing Summary & Checkout Button */}
            {quote && (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Rental ({quote.totalDays}d @ ${quote.effectiveDailyRate}/d)
                    </span>
                    <span className="font-mono text-slate-200">${quote.baseRentalSubtotal.toFixed(2)}</span>
                  </div>
                  {quote.insuranceSubtotal > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>CDW Insurance (${quote.insuranceDailyRate}/d)</span>
                      <span className="font-mono text-slate-200">${quote.insuranceSubtotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Sales Tax & Fees (8.25%)</span>
                    <span className="font-mono text-slate-200">${quote.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 font-semibold">
                    <span>Security Deposit (Refundable Escrow)</span>
                    <span className="font-mono">${quote.securityDeposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white">
                    <span>Total Authorization</span>
                    <span className="font-mono text-lg text-emerald-400">
                      ${quote.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    disabled={isReserving}
                    onClick={() => handleReserve('tok_visa_success')}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-lg shadow-teal-900/40 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isReserving ? 'Authorizing Escrow & Booking...' : `Authorize & Reserve • $${quote.grandTotal.toFixed(2)}`}
                    </span>
                  </button>
                  <button
                    disabled={isReserving}
                    onClick={() => handleReserve('tok_declined')}
                    className="w-full py-1 text-center text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Simulate Card Authorization Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading fleet...</div>}>
      <FleetStorefront />
    </Suspense>
  );
}
