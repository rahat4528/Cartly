'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, Star, Heart, MapPin, Users, Calendar, 
  ShieldCheck, Sparkles, CheckCircle2, AlertCircle, X 
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  country: string;
  nightlyRate: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
}

export default function StaysExplorerPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Reservation Modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [checkIn, setCheckIn] = useState('2026-12-05');
  const [checkOut, setCheckOut] = useState('2026-12-08');
  const [guestCount, setGuestCount] = useState(2);
  const [quote, setQuote] = useState<any | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const categories = ['All', 'Beachfront', 'Cabins', 'Iconic Cities'];

  useEffect(() => {
    fetchListings();
  }, [category, cityFilter]);

  useEffect(() => {
    if (selectedListing) {
      fetchQuote();
    }
  }, [selectedListing, checkIn, checkOut, guestCount]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (category !== 'All') query.append('category', category);
      if (cityFilter) query.append('city', cityFilter);

      const data = await apiRequest(`/listings?${query.toString()}`);
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async () => {
    if (!selectedListing) return;
    try {
      setQuoteLoading(true);
      const q = await apiRequest('/bookings/quote', {
        method: 'POST',
        body: JSON.stringify({
          listingId: selectedListing.id,
          checkIn,
          checkOut,
          guestCount
        })
      });
      setQuote(q);
      setBookingMessage(null);
    } catch (err: any) {
      setQuote(null);
      setBookingMessage({ type: 'error', text: err.message || 'Invalid dates' });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleHoldReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmittingBooking(true);
    setBookingMessage(null);

    try {
      const hold = await apiRequest('/bookings/hold', {
        method: 'POST',
        body: JSON.stringify({
          listingId: selectedListing.id,
          checkIn,
          checkOut,
          guestCount
        })
      });

      // Confirm immediately for smooth user demo experience
      await apiRequest(`/bookings/${hold.id}/confirm`, { method: 'POST' });

      setBookingMessage({
        type: 'success',
        text: 'Reservation confirmed! Your stay is locked in. View details in Trips & Stays.'
      });
      setTimeout(() => {
        setSelectedListing(null);
        setBookingMessage(null);
      }, 2500);
    } catch (err: any) {
      setBookingMessage({
        type: 'error',
        text: err.message || 'Date collision: Selected dates are already booked!'
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search & Category Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        {/* Categories Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                category === cat
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="h-4 w-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search destination city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-24 text-center text-neutral-400 font-medium">Discovering extraordinary stays...</div>
      ) : listings.length === 0 ? (
        <div className="py-24 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
          <p className="text-neutral-600 font-medium">No vacation stays match your search criteria.</p>
          <button
            onClick={() => { setCategory('All'); setCityFilter(''); }}
            className="mt-3 text-xs text-rose-600 font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedListing(item)}
              className="group cursor-pointer flex flex-col"
            >
              {/* Photo Carousel Preview */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 mb-3">
                <img
                  src={item.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-600 hover:text-rose-500 transition backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </button>
                <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {item.category}
                </div>
              </div>

              {/* Card Meta */}
              <div className="flex items-start justify-between text-sm mb-1">
                <span className="font-bold text-neutral-900 line-clamp-1">{item.city}, {item.country}</span>
                <span className="flex items-center gap-1 font-semibold text-neutral-800 text-xs shrink-0">
                  <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
                  4.95
                </span>
              </div>
              <p className="text-xs text-neutral-500 line-clamp-1 mb-1">{item.title}</p>
              <p className="text-xs text-neutral-500 mb-2">Up to {item.maxGuests} guests &bull; {item.bedrooms} bedrooms</p>
              <div className="mt-auto pt-1">
                <span className="font-extrabold text-neutral-900 text-sm">${item.nightlyRate}</span>
                <span className="text-xs text-neutral-600"> / night</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation & Price Breakdown Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setSelectedListing(null); setBookingMessage(null); }}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-neutral-900 mb-1">{selectedListing.title}</h2>
            <p className="text-xs text-neutral-500 mb-4">{selectedListing.location}</p>

            {bookingMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                bookingMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {bookingMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {bookingMessage.text}
              </div>
            )}

            <form onSubmit={handleHoldReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    className="w-full text-xs font-semibold bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Checkout</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full text-xs font-semibold bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Number of Guests</label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                >
                  {Array.from({ length: selectedListing.maxGuests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              {/* Immutable Backend Price Snapshot Breakdown */}
              {quote && (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>${quote.nightlyRate} x {quote.nightsCount} nights</span>
                    <span>${quote.baseSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Cleaning fee</span>
                    <span>${quote.cleaningFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Cartly service fee (12%)</span>
                    <span>${quote.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Occupancy taxes (10%)</span>
                    <span>${quote.occupancyTax.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between font-extrabold text-sm text-neutral-900">
                    <span>Total (USD)</span>
                    <span>${quote.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingBooking || quoteLoading || !quote}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50"
              >
                {submittingBooking ? 'Securing Dates...' : 'Reserve Stay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
