'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Listing, Booking, PriceBreakdown, fetchApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import {
  Heart,
  Star,
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['All', 'Beachfront', 'Cabins', 'Iconic Cities', 'Countryside'];

export default function AccommodationMarketplace() {
  const { user, token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Reservation Drawer State
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [checkIn, setCheckIn] = useState('2027-01-15');
  const [checkOut, setCheckOut] = useState('2027-01-18');
  const [guestCount, setGuestCount] = useState(2);
  const [priceQuote, setPriceQuote] = useState<PriceBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [holdBooking, setHoldBooking] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadListings = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
      const data = await fetchApi(`/listings${catParam}`);
      setListings(data.listings || []);

      if (token && user?.role === 'GUEST') {
        const bData = await fetchApi('/bookings/my', {}, token);
        setMyBookings(bData.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory, token, user?.role]);

  // Fetch server authoritative quote when dates or active listing changes
  useEffect(() => {
    if (!activeListing) return;
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        setBookingError(null);
        const data = await fetchApi(`/listings/${activeListing.id}/quote`, {
          method: 'POST',
          body: JSON.stringify({ checkIn, checkOut })
        });
        setPriceQuote(data.quote);
      } catch (err: any) {
        setPriceQuote(null);
        setBookingError(err.message || 'Invalid stay dates');
      } finally {
        setQuoteLoading(false);
      }
    };
    fetchQuote();
  }, [activeListing, checkIn, checkOut]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreateHold = async () => {
    if (!activeListing || !token) return;
    try {
      setBookingError(null);
      const data = await fetchApi(
        '/bookings',
        {
          method: 'POST',
          body: JSON.stringify({
            listingId: activeListing.id,
            checkIn,
            checkOut,
            guestCount
          })
        },
        token
      );
      setHoldBooking(data.booking);
    } catch (err: any) {
      setBookingError(err.message || 'Booking conflict: dates already reserved');
    }
  };

  const handleConfirmPayment = async () => {
    if (!holdBooking || !token) return;
    try {
      setBookingError(null);
      const data = await fetchApi(
        `/bookings/${holdBooking.id}/confirm`,
        { method: 'POST' },
        token
      );
      setPaymentSuccess(true);
      setHoldBooking(data.booking);
      setTimeout(() => {
        setActiveListing(null);
        setHoldBooking(null);
        setPaymentSuccess(false);
        loadListings();
      }, 1800);
    } catch (err: any) {
      setBookingError(err.message || 'Payment confirmation failed');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    try {
      const res = await fetchApi(`/bookings/${bookingId}/cancel`, { method: 'POST' }, token);
      alert(`Booking cancelled. Net refund amount: $${res.refundAmount.toLocaleString()}`);
      loadListings();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <Navbar />

      {/* Category Navigation Bar */}
      <div className="border-b border-neutral-100 bg-white sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-6 overflow-x-auto">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`pb-2 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                selectedCategory === category
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Guest Active Reservations Summary */}
        {user?.role === 'GUEST' && myBookings.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <span>Your Reserved Stays</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBookings.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-neutral-400">Listing: {b.listingId}</p>
                      <p className="text-sm font-bold text-neutral-800">{b.checkIn} → {b.checkOut}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-600 border-t pt-2">
                    <span>Total: <strong className="text-neutral-900">${b.totalPrice.toLocaleString()}</strong> ({b.nightsCount} nights)</span>
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-rose-600 hover:underline font-semibold"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accommodation Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-neutral-900">Discover Vacation Stays</h1>
            <span className="text-xs font-semibold text-neutral-500">
              Showing {listings.length} verified stays
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-neutral-400">Loading verified accommodations...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">No properties available in this category.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => setActiveListing(listing)}
                  className="group cursor-pointer space-y-3"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-xs">
                    <img
                      src={listing.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={(e) => toggleWishlist(listing.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 active:scale-90 transition text-white"
                    >
                      <Heart
                        className={`w-6 h-6 stroke-2 ${
                          wishlist.includes(listing.id)
                            ? 'fill-rose-500 stroke-rose-500'
                            : 'fill-black/30 stroke-white'
                        }`}
                      />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-neutral-900">
                      {listing.category}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-neutral-900 truncate">{listing.city}, {listing.country}</h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                        <Star className="w-3.5 h-3.5 fill-neutral-900" />
                        <span>4.95</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{listing.title}</p>
                    <p className="text-xs text-neutral-500">{listing.bedrooms} beds • {listing.maxGuests} guests</p>
                    <p className="pt-1 text-sm font-black text-neutral-900">
                      ${listing.nightlyRate.toLocaleString()} <span className="font-normal text-xs text-neutral-500">/ night</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking & Price Breakdown Drawer Modal */}
      {activeListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-rose-500 tracking-wider">{activeListing.category}</span>
                <h3 className="text-xl font-bold text-neutral-900 mt-1">{activeListing.title}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{activeListing.location}</p>
              </div>
              <button
                onClick={() => {
                  setActiveListing(null);
                  setHoldBooking(null);
                  setBookingError(null);
                }}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {bookingError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {paymentSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-900">Reservation Confirmed!</h4>
                <p className="text-xs text-emerald-700">Your stay has been confirmed and paid. Check-in details have been dispatched to your email.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stay Date Controls */}
                <div className="grid grid-cols-2 gap-3 border border-neutral-300 rounded-2xl p-3 bg-neutral-50">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">CHECK-IN</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-neutral-800 focus:outline-hidden"
                    />
                  </div>
                  <div className="border-l border-neutral-300 pl-3">
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">CHECKOUT</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-neutral-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Authoritative Server-side Price Breakdown */}
                {quoteLoading ? (
                  <div className="py-4 text-center text-xs text-neutral-400">Calculating authoritative price breakdown...</div>
                ) : priceQuote ? (
                  <div className="space-y-3 border-t border-neutral-100 pt-4">
                    <p className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Price Breakdown (Server Calculated)</p>
                    <div className="space-y-2 text-xs text-neutral-600">
                      <div className="flex justify-between">
                        <span>${priceQuote.nightlyRate.toLocaleString()} x {priceQuote.nightsCount} nights</span>
                        <span>${priceQuote.baseSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>${priceQuote.cleaningFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Marketplace service fee (12%)</span>
                        <span>${priceQuote.serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupancy taxes (10%)</span>
                        <span>${priceQuote.occupancyTax.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-base font-black text-neutral-900">
                      <span>Total Before Taxes & Fees</span>
                      <span className="text-xl text-rose-600">${priceQuote.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ) : null}

                {/* Reservation Action */}
                {!holdBooking ? (
                  <button
                    onClick={handleCreateHold}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Reserve 10-Minute Hold</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Hold Active: Expires in 10 mins</span>
                      </div>
                      <span className="font-bold">Hold #{holdBooking.id}</span>
                    </div>

                    <button
                      onClick={handleConfirmPayment}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay & Confirm Stay (${holdBooking.totalPrice.toLocaleString()})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
