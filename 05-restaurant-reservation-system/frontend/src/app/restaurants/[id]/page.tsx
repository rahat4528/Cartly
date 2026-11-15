'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  MapPin, Clock, Calendar, Users, Utensils, Check,
  AlertCircle, ArrowLeft, CheckCircle2, X, Sparkles, Bell
} from 'lucide-react';
import Link from 'next/link';

function RestaurantDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, login } = useAuth();

  const restaurantId = params.id as string;
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(searchParams.get('date') || today);
  const [partySize, setPartySize] = useState(searchParams.get('partySize') || '2');
  const [zone, setZone] = useState('INDOOR_MAIN');

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState<string | null>(searchParams.get('time') || null);
  const [guestName, setGuestName] = useState(user?.name || 'Marcus Sterling');
  const [guestEmail, setGuestEmail] = useState(user?.email || 'diner@cartly.local');
  const [guestPhone, setGuestPhone] = useState('+1 (555) 345-6789');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Waitlist State
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistConfirmed, setWaitlistConfirmed] = useState<any>(null);

  const loadRestaurantData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(
        `/restaurants/${restaurantId}?date=${date}&partySize=${partySize}&zone=${zone}`
      );
      setRestaurant(res.restaurant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId, date, partySize, zone]);

  const handleBookTable = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (!user) {
        await login('diner@cartly.local', 'Pass123!');
      }

      const res = await fetchApi('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId,
          reservationDate: date,
          timeSlot: selectedSlot,
          partySize: Number(partySize),
          seatingZone: zone,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests
        })
      });

      setBookingConfirmed(res.reservation);
      loadRestaurantData(); // Refresh slots
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not allocate table for requested slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (slotToWaitlist: string) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (!user) {
        await login('diner@cartly.local', 'Pass123!');
      }

      const res = await fetchApi('/waitlist/join', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId,
          reservationDate: date,
          preferredTimeSlot: slotToWaitlist,
          partySize: Number(partySize),
          seatingZone: zone,
          guestName,
          guestEmail,
          guestPhone
        })
      });

      setWaitlistConfirmed(res.waitlistEntry);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not join waitlist.');
    } finally {
      setSubmitting(false);
    }
  };

  const getZoneLabel = (z: string) => {
    switch (z) {
      case 'INDOOR_MAIN': return 'Main Dining Room';
      case 'PATIO_TERRACE': return 'Outdoor Patio & Garden';
      case 'BAR_HIGHTOP': return 'Bar High-Tops';
      case 'CHEFS_COUNTER': return "Chef's Tasting Counter";
      default: return z;
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-stone-400 text-sm">Loading restaurant floor plan & table slots...</div>;
  }

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <h2 className="text-xl font-bold text-stone-800">Restaurant not found</h2>
        <Link href="/" className="text-wine-700 text-sm mt-4 inline-block font-bold">Return to Directory</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-wine-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dining Directory
      </Link>

      {/* Header Info */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-wine-100 text-wine-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {restaurant.cuisine} &middot; {restaurant.priceTier}
            </span>
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              {restaurant.address}, {restaurant.neighborhood}, {restaurant.city}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">{restaurant.name}</h1>
        </div>

        {/* Date & Party Selector Box */}
        <div className="bg-white p-3 rounded-xl border border-stone-300 shadow-xs flex flex-wrap items-center gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Date</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="font-semibold text-stone-800 border-0 p-0 focus:ring-0"
            />
          </div>
          <div className="border-l border-stone-200 pl-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Party Size</span>
            <select
              value={partySize}
              onChange={e => setPartySize(e.target.value)}
              className="font-semibold text-stone-800 border-0 p-0 focus:ring-0 bg-white"
            >
              <option value="1">1 Diner</option>
              <option value="2">2 Diners</option>
              <option value="4">4 Diners</option>
              <option value="6">6 Diners</option>
              <option value="8">8 Diners</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 rounded-2xl overflow-hidden max-h-[420px]">
        <div className="md:col-span-2 h-[420px]">
          <img
            src={restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:flex flex-col gap-3 h-[420px]">
          <div className="h-1/2 overflow-hidden">
            <img
              src={restaurant.images?.[1] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-1/2 overflow-hidden">
            <img
              src={restaurant.images?.[2] || restaurant.images?.[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Description & Seating Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-3">About The Experience</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            {restaurant.description}
          </p>

          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-3">Amenities & Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {restaurant.amenities?.map((amenity: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 border border-stone-200">
                <Check className="w-3.5 h-3.5 text-wine-700" />
                {amenity}
              </div>
            ))}
          </div>
        </div>

        {/* Operating Hours & Policy */}
        <div className="bg-wine-50/50 rounded-2xl p-6 border border-wine-200 text-xs">
          <h3 className="font-serif font-bold text-stone-900 text-sm mb-3">Dining & Seating Policy</h3>
          <ul className="space-y-2.5 text-stone-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-wine-700 shrink-0 mt-0.5" />
              <span>Dinner Service: <strong>{restaurant.openTime} &ndash; {restaurant.closeTime}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <Utensils className="w-4 h-4 text-wine-700 shrink-0 mt-0.5" />
              <span>Dining Duration: <strong>90 minutes</strong> for parties up to 4; <strong>120 minutes</strong> for larger groups.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-wine-700 shrink-0 mt-0.5" />
              <span><strong>Automated Waitlist:</strong> If your requested time is full, join our waitlist for instant auto-promotion if a party cancels.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ==================== SEATING ZONE & TIME SLOT PICKER ==================== */}
      <div className="border-t border-stone-300 pt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">Select Seating Zone & Time</h2>
            <p className="text-xs text-stone-500 mt-0.5">Dining date: {date} &middot; Party of {partySize}</p>
          </div>

          {/* Zone Selector Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['INDOOR_MAIN', 'PATIO_TERRACE', 'BAR_HIGHTOP', 'CHEFS_COUNTER'].map(z => (
              <button
                key={z}
                onClick={() => setZone(z)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  zone === z
                    ? 'bg-wine-900 text-white shadow-xs'
                    : 'bg-white border border-stone-300 text-stone-700 hover:border-stone-400'
                }`}
              >
                {getZoneLabel(z)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slot Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {restaurant.availableSlots?.map((slot: any) => (
            <div
              key={slot.timeSlot}
              className={`p-4 rounded-xl border text-center transition-all ${
                slot.isAvailable
                  ? 'bg-white border-stone-300 hover:border-wine-800 hover:shadow-md cursor-pointer'
                  : 'bg-stone-100 border-stone-200 text-stone-400'
              }`}
            >
              <div className="font-serif font-bold text-lg text-stone-900 mb-1">{slot.timeSlot}</div>
              {slot.isAvailable ? (
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block mb-2">Table Available</span>
                  <button
                    onClick={() => {
                      setSelectedSlot(slot.timeSlot);
                      setBookingConfirmed(null);
                      setWaitlistConfirmed(null);
                      setErrorMsg(null);
                    }}
                    className="w-full bg-wine-900 hover:bg-wine-800 text-white text-[11px] font-bold py-1.5 rounded-md transition-colors"
                  >
                    Reserve Table
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold block mb-2">Fully Booked</span>
                  <button
                    onClick={() => {
                      setSelectedSlot(slot.timeSlot);
                      setWaitlistModalOpen(true);
                      setBookingConfirmed(null);
                      setWaitlistConfirmed(null);
                    }}
                    className="w-full bg-stone-200 hover:bg-stone-300 text-stone-700 text-[11px] font-bold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    Join Waitlist
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== RESERVATION MODAL ==================== */}
      {selectedSlot && !waitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-300 relative">
            <button
              onClick={() => {
                setSelectedSlot(null);
                setBookingConfirmed(null);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingConfirmed ? (
              // Booking Confirmed Success View
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900 mb-1">Table Reserved!</h3>
                <p className="text-xs text-stone-500 mb-6">
                  Your table at <strong>{restaurant.name}</strong> is confirmed.
                </p>

                <div className="bg-stone-100 rounded-xl p-4 text-left border border-stone-300 mb-6 max-w-sm mx-auto text-xs space-y-2">
                  <div className="flex justify-between border-b border-stone-200 pb-2">
                    <span className="text-stone-500">Reservation Code:</span>
                    <span className="font-mono font-bold text-wine-900 text-sm">{bookingConfirmed.reservationCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Table Number(s):</span>
                    <span className="font-bold text-stone-800">{bookingConfirmed.tableNumbers?.join(' + ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date & Time:</span>
                    <span className="font-bold text-stone-800">{bookingConfirmed.reservationDate} at {bookingConfirmed.timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Party Size:</span>
                    <span className="font-bold text-stone-800">{bookingConfirmed.partySize} Diners</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Seating Area:</span>
                    <span className="font-bold text-stone-800">{getZoneLabel(bookingConfirmed.seatingZone)}</span>
                  </div>
                </div>

                <Link
                  href="/reservations"
                  className="bg-wine-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg hover:bg-wine-800 transition-colors inline-block"
                >
                  View My Dining Reservations
                </Link>
              </div>
            ) : (
              // Booking Form View
              <div>
                <div className="mb-4 pb-3 border-b border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-wine-700 tracking-wider">Confirm Your Table</span>
                  <h3 className="font-serif font-bold text-lg text-stone-900">{restaurant.name}</h3>
                  <p className="text-xs text-stone-500">
                    {date} at <strong>{selectedSlot}</strong> &middot; Party of {partySize} ({getZoneLabel(zone)})
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3 mb-6 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Diner Full Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Special Dietary Requests / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Vegetarian preference, anniversary, high chair needed"
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <button
                  disabled={submitting}
                  onClick={handleBookTable}
                  className="w-full bg-wine-900 hover:bg-wine-800 disabled:bg-stone-300 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-colors"
                >
                  {submitting ? 'Allocating Dining Table...' : 'Confirm Reservation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== WAITLIST MODAL ==================== */}
      {waitlistModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-300 relative">
            <button
              onClick={() => {
                setWaitlistModalOpen(false);
                setWaitlistConfirmed(null);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            {waitlistConfirmed ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">Added to Automated Waitlist</h3>
                <p className="text-xs text-stone-500 mb-4">
                  You are #{waitlistConfirmed.priorityIndex} in line for <strong>{restaurant.name}</strong> on {date} around {selectedSlot}.
                </p>

                <div className="bg-stone-100 rounded-xl p-4 border border-stone-200 text-xs mb-6 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Waitlist Ticket:</span>
                    <span className="font-mono font-bold text-stone-900">{waitlistConfirmed.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Party Size:</span>
                    <span className="font-bold text-stone-800">{waitlistConfirmed.partySize} Diners</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Auto-Promotion:</span>
                    <span className="text-emerald-700 font-bold">Active</span>
                  </div>
                </div>

                <Link
                  href="/reservations"
                  className="bg-wine-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-wine-800"
                >
                  View Waitlist Tracker
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-wine-800 mb-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="font-serif font-bold text-lg text-stone-900">Join Prime Dinner Waitlist</h3>
                </div>
                <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                  The {selectedSlot} slot is currently fully committed. If any party cancels within 30 minutes of this time, our engine will automatically promote your party with an exclusive 15-minute claim window.
                </p>

                <div className="space-y-3 mb-6 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Diner Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Email for Instant Alert</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <button
                  disabled={submitting}
                  onClick={() => handleJoinWaitlist(selectedSlot)}
                  className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-colors"
                >
                  {submitting ? 'Adding to Waitlist...' : 'Join Waitlist for ' + selectedSlot}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading restaurant details...</div>}>
      <RestaurantDetailContent />
    </Suspense>
  );
}
