'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { Movie, Showtime, SeatMatrixResponse, SeatInfo, Booking, fetchApi } from '../../../lib/api';
import { Film, Clock, Calendar, Ticket, CheckCircle2, AlertCircle, Lock, ShieldAlert, CreditCard } from 'lucide-react';

function BookingFlow() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, quickSwitch } = useAuth();

  const movieId = params.id as string;
  const initialShowtimeId = searchParams.get('showtimeId');

  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(initialShowtimeId);
  const [seatMatrix, setSeatMatrix] = useState<SeatMatrixResponse | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [holdTimer, setHoldTimer] = useState<number>(480);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load movie and showtimes
  useEffect(() => {
    fetchApi<{ movie: Movie }>(`/movies/${movieId}`)
      .then((data) => {
        setMovie(data.movie);
        if (!selectedShowtimeId && data.movie.showtimes && data.movie.showtimes.length > 0) {
          setSelectedShowtimeId(data.movie.showtimes[0].id);
        }
      })
      .catch((err) => setErrorMsg(err.message));
  }, [movieId, selectedShowtimeId]);

  // Load seat matrix when showtime changes
  const loadSeatMatrix = (showtimeId: string) => {
    fetchApi<SeatMatrixResponse>(`/showtimes/${showtimeId}/seats`)
      .then((matrix) => {
        setSeatMatrix(matrix);
        setSelectedSeats([]);
        setErrorMsg(null);
      })
      .catch((err) => setErrorMsg(err.message));
  };

  useEffect(() => {
    if (selectedShowtimeId) {
      loadSeatMatrix(selectedShowtimeId);
    }
  }, [selectedShowtimeId]);

  // Hold timer countdown
  useEffect(() => {
    if (!activeBooking || !activeBooking.holdExpiresAt) return;
    const expires = new Date(activeBooking.holdExpiresAt).getTime();

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setHoldTimer(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setActiveBooking(null);
        setErrorMsg('Your 8-minute seat hold has expired. Please select your seats again.');
        if (selectedShowtimeId) loadSeatMatrix(selectedShowtimeId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking, selectedShowtimeId]);

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatInfo) => {
    if (seat.status !== 'AVAILABLE' || activeBooking) return;

    if (selectedSeats.includes(seat.label)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat.label));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat.label]);
    }
  };

  // Pricing calculations
  const selectedSeatObjects = (seatMatrix?.seats || []).filter((s) =>
    selectedSeats.includes(s.label)
  );
  const seatsSubtotal = selectedSeatObjects.reduce((acc, s) => acc + s.price, 0);
  const convenienceFee = selectedSeats.length * 1.5;
  const grandTotal = seatsSubtotal + convenienceFee;

  // Request hold
  const handleCreateHold = async () => {
    if (!user) {
      alert('Please log in as a patron to reserve seats.');
      await quickSwitch('patron');
      return;
    }
    if (!selectedShowtimeId || selectedSeats.length === 0) return;

    setIsHolding(true);
    setErrorMsg(null);
    try {
      const res = await fetchApi<{ booking: Booking }>(
        '/bookings/hold',
        {
          method: 'POST',
          body: JSON.stringify({
            showtimeId: selectedShowtimeId,
            seatLabels: selectedSeats,
          }),
        },
        token
      );
      setActiveBooking(res.booking);
      if (selectedShowtimeId) loadSeatMatrix(selectedShowtimeId);
    } catch (err: any) {
      setErrorMsg(err.message);
      if (selectedShowtimeId) loadSeatMatrix(selectedShowtimeId);
    } finally {
      setIsHolding(false);
    }
  };

  // Confirm booking with sandbox card
  const handleConfirmBooking = async (cardToken: string = 'tok_visa_success') => {
    if (!activeBooking || !token) return;

    setIsConfirming(true);
    setErrorMsg(null);
    try {
      const res = await fetchApi<{ booking: Booking }>(
        `/bookings/${activeBooking.id}/confirm`,
        {
          method: 'POST',
          body: JSON.stringify({
            cardToken,
            idempotencyKey: `idem_pay_${activeBooking.id}_${Date.now()}`,
          }),
        },
        token
      );
      setConfirmedBooking(res.booking);
      setActiveBooking(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!movie) {
    return <div className="p-12 text-center text-slate-500">Loading movie details...</div>;
  }

  // Success Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Tickets Confirmed!</h2>
        <p className="text-slate-400 text-sm">
          Your admission tickets have been generated with verifiable QR codes.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-500">Booking Reference</span>
              <div className="text-base font-bold text-white">{confirmedBooking.bookingRef}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono uppercase text-slate-500">Ticket Pass Code</span>
              <div className="text-base font-mono font-bold text-red-400">{confirmedBooking.ticketCode}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Movie</span>
              <div className="font-semibold text-slate-200">{movie.title}</div>
            </div>
            <div>
              <span className="text-slate-500">Auditorium</span>
              <div className="font-semibold text-slate-200">Screen 1 • Dolby Atmos</div>
            </div>
            <div>
              <span className="text-slate-500">Reserved Seats</span>
              <div className="font-semibold text-amber-400">{confirmedBooking.seats.join(', ')}</div>
            </div>
            <div>
              <span className="text-slate-500">Total Paid</span>
              <div className="font-semibold text-emerald-400">${confirmedBooking.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/tickets')}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-900/40"
          >
            Open Ticket Wallet
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Browse More Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Movie Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center space-x-5">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-800"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/40">
                {movie.rating}
              </span>
              <span className="text-xs text-slate-400">{movie.genre}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">{movie.title}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-4">
              <span>{movie.runtimeMinutes} minutes</span>
              <span>•</span>
              <span>Auditorium 1 (Standard & Recliner Tiers)</span>
            </p>
          </div>
        </div>

        {/* Showtimes Selector */}
        <div className="w-full md:w-auto">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Showtime
          </label>
          <div className="flex flex-wrap gap-2">
            {(movie.showtimes || []).map((st) => {
              const active = st.id === selectedShowtimeId;
              const timeStr = new Date(st.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <button
                  key={st.id}
                  disabled={!!activeBooking}
                  onClick={() => setSelectedShowtimeId(st.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  } ${activeBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div>{timeStr}</div>
                  <div className="text-[10px] font-normal opacity-75">{st.format.replace('_', ' ')}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Seat Matrix & Checkout Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map Col (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          {/* Cinema Screen Projection Curve */}
          <div className="text-center space-y-2">
            <div className="w-3/4 mx-auto h-3 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-full shadow-lg shadow-white/10" />
            <div className="text-[10px] tracking-widest uppercase font-mono text-slate-500">
              Auditorium Curved Screen
            </div>
          </div>

          {/* Seat Grid */}
          {seatMatrix ? (
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[480px] flex flex-col items-center space-y-2.5">
                {seatMatrix.rows.map((row) => (
                  <div key={row} className="flex items-center space-x-2">
                    <span className="w-5 text-right font-mono text-xs text-slate-500 font-bold">
                      {row}
                    </span>
                    <div className="flex items-center space-x-2">
                      {seatMatrix.cols.map((col) => {
                        const seat = seatMatrix.seats.find((s) => s.row === row && s.col === col);
                        if (!seat) return <div key={col} className="w-7 h-7" />;

                        const isSelected = selectedSeats.includes(seat.label);
                        const isBooked = seat.status === 'BOOKED';
                        const isHeld = seat.status === 'HELD' && !isSelected;

                        // Tier colors
                        let seatColor = 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500';
                        if (seat.tier === 'PREMIUM') {
                          seatColor = 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300 hover:border-indigo-400';
                        } else if (seat.tier === 'VIP_RECLINER') {
                          seatColor = 'bg-amber-950/80 border-amber-700/60 text-amber-300 hover:border-amber-400';
                        }

                        if (isSelected) {
                          seatColor = 'bg-red-600 border-red-400 text-white ring-2 ring-red-400/50 shadow-lg';
                        } else if (isHeld) {
                          seatColor = 'bg-orange-950/50 border-orange-800 text-orange-400/50 cursor-not-allowed';
                        } else if (isBooked) {
                          seatColor = 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed';
                        }

                        return (
                          <button
                            key={seat.label}
                            title={`${seat.label} • ${seat.tier} • $${seat.price}`}
                            disabled={isBooked || isHeld || (!!activeBooking && !isSelected)}
                            onClick={() => handleToggleSeat(seat)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition-all ${seatColor}`}
                          >
                            {isBooked ? '✕' : isHeld ? <Lock className="w-3 h-3" /> : col}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-5 text-left font-mono text-xs text-slate-500 font-bold">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">Loading auditorium seat layout...</div>
          )}

          {/* Seat Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
              <span className="text-slate-400">Standard ($14.50)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-indigo-950/80 border border-indigo-700/60" />
              <span className="text-indigo-400">Premium ($18.50)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-700/60" />
              <span className="text-amber-400">VIP Recliner ($24.00)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-red-600 border border-red-400" />
              <span className="text-white">Selected</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-orange-950 border border-orange-800 flex items-center justify-center text-[10px] text-orange-400">
                <Lock className="w-2.5 h-2.5" />
              </div>
              <span className="text-orange-400">Held (8m)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-700 flex items-center justify-center">
                ✕
              </div>
              <span className="text-slate-600">Occupied</span>
            </div>
          </div>
        </div>

        {/* Sidebar Summary & Payment Pane */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Ticket Selection</h2>
              {activeBooking && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {Math.floor(holdTimer / 60)}:
                    {(holdTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Selected Seats summary */}
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Selected Seats ({selectedSeats.length})</span>
                <span className="font-mono text-white font-bold">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                </span>
              </div>

              {selectedSeatObjects.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  {selectedSeatObjects.map((s) => (
                    <div key={s.label} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        Seat {s.label} ({s.tier})
                      </span>
                      <span className="text-slate-200 font-mono">${s.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Convenience Fee ($1.50/ea)</span>
                    <span className="font-mono">${convenienceFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Total Amount</span>
                <span className="font-mono font-bold text-lg text-emerald-400">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Active Hold Lock Warning */}
            {activeBooking ? (
              <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-red-400 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Seats Temporarily Locked</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  These seats are locked exclusively for your account for 8 minutes. Complete checkout to finalize your tickets.
                </p>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div>
            {!activeBooking ? (
              <button
                disabled={selectedSeats.length === 0 || isHolding}
                onClick={handleCreateHold}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isHolding ? 'Holding Seats...' : 'Hold Seats (8 Min Lock)'}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  disabled={isConfirming}
                  onClick={() => handleConfirmBooking('tok_visa_success')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isConfirming ? 'Authorizing Payment...' : `Pay $${grandTotal.toFixed(2)} (Sandbox)`}</span>
                </button>
                <button
                  disabled={isConfirming}
                  onClick={() => handleConfirmBooking('tok_declined')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs transition-colors"
                >
                  Simulate Card Decline
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MovieBookingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading seat matrix...</div>}>
      <BookingFlow />
    </Suspense>
  );
}
