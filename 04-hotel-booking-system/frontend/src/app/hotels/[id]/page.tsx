'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  MapPin, Star, Calendar, Users, Bed, Check, ShieldCheck,
  Clock, AlertCircle, ArrowLeft, CreditCard, CheckCircle2, X
} from 'lucide-react';
import Link from 'next/link';

function HotelDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, login } = useAuth();

  const hotelId = params.id as string;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = tomorrow.toISOString().split('T')[0];

  const future = new Date();
  future.setDate(future.getDate() + 4);
  const defaultCheckOut = future.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || defaultCheckOut);
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [rooms, setRooms] = useState(searchParams.get('rooms') || '1');

  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hold Modal State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(600);
  const [guestName, setGuestName] = useState(user?.name || 'Elena Rostova');
  const [guestEmail, setGuestEmail] = useState(user?.email || 'guest@cartly.local');
  const [guestPhone, setGuestPhone] = useState('+1 (555) 234-5678');
  const [cardToken, setCardToken] = useState('tok_visa_success');
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHotelData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/hotels/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}`);
      setHotel(res.hotel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelData();
  }, [hotelId, checkIn, checkOut]);

  // Countdown timer for active hold
  useEffect(() => {
    if (!activeReservation || bookingConfirmed) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(activeReservation.expiresAt).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setHoldSecondsRemaining(remaining);

      if (remaining === 0) {
        setErrorMsg('Your 10-minute hold has expired. Please re-select your room.');
        setActiveReservation(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReservation, bookingConfirmed]);

  const handleStartHold = async (roomType: any) => {
    setErrorMsg(null);
    setBookingConfirmed(null);
    setSelectedRoom(roomType);
    setHolding(true);

    try {
      // Ensure authenticated
      if (!user) {
        await login('guest@cartly.local', 'Pass123!');
      }

      const res = await fetchApi('/reservations/hold', {
        method: 'POST',
        body: JSON.stringify({
          hotelId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomsCount: Number(rooms),
          guestName,
          guestEmail,
          guestPhone
        })
      });

      setActiveReservation(res.reservation);
      setHoldSecondsRemaining(600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not place temporary hold on room.');
    } finally {
      setHolding(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeReservation) return;
    setConfirming(true);
    setErrorMsg(null);

    try {
      const res = await fetchApi(`/reservations/${activeReservation.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          cardToken,
          idempotencyKey: `idem_web_${activeReservation.id}_${Date.now()}`
        })
      });

      setBookingConfirmed(res.reservation);
      loadHotelData(); // Refresh room counts
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment failed. Reservation hold remains active.');
    } finally {
      setConfirming(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400 text-sm">Loading property details & live room calendar...</div>;
  }

  if (!hotel) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <h2 className="text-xl font-bold text-slate-800">Hotel not found</h2>
        <Link href="/" className="text-amber-700 text-sm mt-4 inline-block font-bold">Return to Destinations</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Destinations
      </Link>

      {/* Header Info */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {hotel.starRating} Star Luxury
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {hotel.address}, {hotel.city}, {hotel.country}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-navy-900">{hotel.name}</h1>
        </div>

        {/* Date Selector Box */}
        <div className="bg-white p-3 rounded-xl border border-sand-300 shadow-xs flex flex-wrap items-center gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-In</span>
            <input
              type="date"
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="font-semibold text-slate-800 border-0 p-0 focus:ring-0"
            />
          </div>
          <div className="text-slate-300">&rarr;</div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-Out</span>
            <input
              type="date"
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="font-semibold text-slate-800 border-0 p-0 focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 rounded-2xl overflow-hidden max-h-[460px]">
        <div className="md:col-span-2 h-[460px]">
          <img
            src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:flex flex-col gap-3 h-[460px]">
          <div className="h-1/2 overflow-hidden">
            <img
              src={hotel.images?.[1] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-1/2 overflow-hidden">
            <img
              src={hotel.images?.[2] || hotel.images?.[0]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Description & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-serif font-bold text-navy-900 mb-3">About The Property</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {hotel.description}
          </p>

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">Signature Amenities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {hotel.amenities?.map((amenity: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-sand-100/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 border border-sand-200">
                <Check className="w-3.5 h-3.5 text-amber-700" />
                {amenity}
              </div>
            ))}
          </div>
        </div>

        {/* Policies Box */}
        <div className="bg-sand-100 rounded-2xl p-6 border border-sand-300">
          <h3 className="font-serif font-bold text-navy-900 text-sm mb-3">Reservation Policies</h3>
          <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Check-in: <strong>{hotel.checkInTime}</strong> &middot; Check-out: <strong>{hotel.checkOutTime}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span><strong>Free Cancellation:</strong> 100% refund up to 48 hours prior to check-in. 50% refund between 24 and 48 hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span><strong>Taxes & Fees:</strong> 12% Occupancy Tax and $35 flat resort/cleaning fee included at checkout.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Available Room Types */}
      <div className="border-t border-sand-300 pt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-navy-900">Available Rooms & Suites</h2>
          <span className="text-xs text-slate-500 font-medium">Dates: {checkIn} &rarr; {checkOut}</span>
        </div>

        <div className="space-y-6">
          {hotel.roomTypes?.map((room: any) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-sand-300 p-6 shadow-xs flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow"
            >
              <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-navy-900">{room.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 mb-2">
                        <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-slate-400" /> {room.bedType}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Up to {room.maxGuests} Guests</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-xl text-navy-900">${room.basePricePerNight}</span>
                      <span className="text-xs text-slate-500 block">/ base night</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">{room.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {room.amenities?.map((am: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-between">
                  <div className="text-xs">
                    {room.availableRooms > 0 ? (
                      <span className={`font-bold ${room.availableRooms <= 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {room.availableRooms === 1
                          ? 'Only 1 room remaining!'
                          : `${room.availableRooms} rooms available`}
                      </span>
                    ) : (
                      <span className="font-bold text-rose-600">Sold out for selected dates</span>
                    )}
                  </div>

                  <button
                    disabled={room.availableRooms <= 0 || holding}
                    onClick={() => handleStartHold(room)}
                    className="bg-navy-900 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Hold Room (10 min)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== TEMPORARY HOLD & CHECKOUT MODAL ==================== */}
      {(selectedRoom || activeReservation) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sand-300 relative my-8">
            <button
              onClick={() => {
                setSelectedRoom(null);
                setActiveReservation(null);
                setBookingConfirmed(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingConfirmed ? (
              // Booking Confirmed Success View
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-navy-900 mb-2">Reservation Confirmed!</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Your stay at <strong>{hotel.name}</strong> is permanently secured and confirmed.
                </p>

                <div className="bg-sand-100 rounded-xl p-5 text-left border border-sand-300 mb-6 max-w-md mx-auto text-xs space-y-2">
                  <div className="flex justify-between border-b border-sand-200 pb-2">
                    <span className="text-slate-500">Booking Voucher:</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">{bookingConfirmed.voucherCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Room Type:</span>
                    <span className="font-bold text-slate-800">{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in:</span>
                    <span className="font-bold text-slate-800">{bookingConfirmed.checkInDate} (15:00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-out:</span>
                    <span className="font-bold text-slate-800">{bookingConfirmed.checkOutDate} (11:00)</span>
                  </div>
                  <div className="flex justify-between border-t border-sand-200 pt-2 text-sm">
                    <span className="font-bold text-slate-700">Total Paid:</span>
                    <span className="font-serif font-bold text-navy-900">${bookingConfirmed.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <Link
                    href="/reservations"
                    className="bg-navy-900 text-white font-bold text-xs px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors"
                  >
                    View My Reservations
                  </Link>
                </div>
              </div>
            ) : (
              // Active Hold & Checkout Step
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-sand-200 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Temporary Inventory Hold</span>
                    <h3 className="font-serif font-bold text-lg text-navy-900">{selectedRoom?.name}</h3>
                  </div>

                  {/* 10-Minute Countdown Clock */}
                  <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-800 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    <span>{formatCountdown(holdSecondsRemaining)}</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Nightly Cost Breakdown Table */}
                {activeReservation?.nightlyBreakdown && (
                  <div className="bg-sand-50 rounded-xl p-4 border border-sand-200 mb-6 text-xs">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Itemized Nightly Rate Breakdown</h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
                      {activeReservation.nightlyBreakdown.map((night: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600 border-b border-sand-100 pb-1">
                          <span>
                            {night.date} {night.isWeekend && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">Weekend</span>}
                            {night.seasonMultiplier > 1.0 && <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded ml-1 font-bold">{night.seasonName}</span>}
                          </span>
                          <span className="font-mono font-semibold">${night.nightlyTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-sand-300 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Nightly Subtotal ({activeReservation.nightsCount} nights):</span>
                        <span className="font-mono">${activeReservation.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Hospitality Occupancy Tax (12%):</span>
                        <span className="font-mono">${activeReservation.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Resort & Cleaning Fee (flat):</span>
                        <span className="font-mono">${activeReservation.feesAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-navy-900 pt-1 border-t border-sand-300">
                        <span>Grand Total:</span>
                        <span className="font-serif font-black text-base">${activeReservation.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guest Details & Payment Simulation */}
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Guest Full Name</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email for Voucher</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-bold text-slate-700 mb-1">Sandbox Payment Simulation</label>
                    <select
                      value={cardToken}
                      onChange={e => setCardToken(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                    >
                      <option value="tok_visa_success">Visa &bull;&bull;&bull;&bull; 4242 (Simulate Payment Success)</option>
                      <option value="tok_card_declined">Visa &bull;&bull;&bull;&bull; 0002 (Simulate Bank Decline)</option>
                    </select>
                  </div>
                </div>

                <button
                  disabled={confirming || holdSecondsRemaining === 0}
                  onClick={handleConfirmPayment}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {confirming ? 'Authorizing Sandbox Payment...' : `Confirm & Pay $${activeReservation?.totalAmount.toFixed(2) || '...'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HotelDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading hotel suite details...</div>}>
      <HotelDetailContent />
    </Suspense>
  );
}
