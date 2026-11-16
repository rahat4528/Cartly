'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Star, AlertCircle, CheckCircle2, 
  MapPin, Clock, ShieldCheck, XCircle, MessageSquare 
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function GuestTripsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewAlert, setReviewAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const [bookingsData, listingsData] = await Promise.all([
        apiRequest('/bookings/my').catch(() => []),
        apiRequest('/listings').catch(() => [])
      ]);

      setBookings(bookingsData);
      const map: Record<string, any> = {};
      for (const l of listingsData) {
        map[l.id] = l;
      }
      setListingsMap(map);
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? Full refund will be credited.')) return;
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'POST' });
      fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setSubmittingReview(true);
    setReviewAlert(null);

    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: reviewModalBooking.listingId,
          rating,
          comment
        })
      });

      setReviewAlert({
        type: 'success',
        text: 'Review published! Thank you for sharing your verified experience.'
      });
      setTimeout(() => {
        setReviewModalBooking(null);
        setReviewAlert(null);
        setComment('');
      }, 2000);
    } catch (err: any) {
      setReviewAlert({
        type: 'error',
        text: err.message || 'Error posting review.'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="pb-6 mb-6 border-b border-neutral-200">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Your Trips & Reservations</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review upcoming travel itineraries, booking confirmations, cancellations, and leave verified reviews for completed stays.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-neutral-400 font-medium">Loading your reservation history...</div>
      ) : bookings.length === 0 ? (
        <div className="py-24 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
          <p className="text-neutral-600 font-semibold mb-2">No trips booked yet.</p>
          <p className="text-xs text-neutral-400 mb-4">When you book accommodation stays, they will appear here with complete itinerary details.</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-bold hover:bg-neutral-800 transition"
          >
            Start exploring stays
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const listing = listingsMap[booking.listingId];
            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                    <img
                      src={listing?.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'}
                      alt={listing?.title || 'Stay'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-neutral-900">
                        {listing?.title || 'Accommodation Stay'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'COMPLETED' ? 'bg-neutral-100 text-neutral-800' :
                        booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing?.location || 'Stay location'}
                    </p>

                    <p className="text-xs text-neutral-700">
                      <strong>Dates:</strong> {booking.checkIn} &rarr; {booking.checkOut} ({booking.nightsCount} nights, {booking.guestCount} guests)
                    </p>

                    <p className="text-xs font-semibold text-neutral-900 pt-1">
                      Total Paid: ${booking.totalPrice.toLocaleString()} USD
                    </p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold rounded-xl transition"
                    >
                      Cancel Stay (100% Refund)
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <button
                      onClick={() => setReviewModalBooking(booking)}
                      className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      Write Verified Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Gating Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h2 className="text-base font-bold text-neutral-900 mb-1">Write a Verified Review</h2>
            <p className="text-xs text-neutral-500 mb-4">
              {listingsMap[reviewModalBooking.listingId]?.title} &bull; Stay Completed
            </p>

            {reviewAlert && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                reviewAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {reviewAlert.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {reviewAlert.text}
              </div>
            )}

            <form onSubmit={handlePostReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star className={`h-6 w-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Your Review</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the cleanliness, amenities, views, and communication with your host..."
                  required
                  className="w-full text-xs border border-neutral-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-neutral-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-neutral-600 border border-neutral-300 rounded-xl hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 disabled:opacity-50"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
