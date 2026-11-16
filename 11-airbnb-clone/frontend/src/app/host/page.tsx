'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, Calendar, DollarSign, 
  MapPin, CheckCircle2, AlertCircle, X, Users 
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function HostPortalPage() {
  const { user } = useAuth();
  const [hostBookings, setHostBookings] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Listing Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Beachfront');
  const [location, setLocation] = useState('Carmel-by-the-Sea, California, United States');
  const [city, setCity] = useState('Carmel');
  const [nightlyRate, setNightlyRate] = useState('420');
  const [cleaningFee, setCleaningFee] = useState('150');
  const [maxGuests, setMaxGuests] = useState('4');
  const [submittingListing, setSubmittingListing] = useState(false);

  useEffect(() => {
    fetchHostData();
  }, [user]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      const [bookingsData, listingsData] = await Promise.all([
        apiRequest('/bookings/host').catch(() => []),
        apiRequest('/listings').catch(() => [])
      ]);
      setHostBookings(bookingsData);
      setListings(listingsData);
    } catch (err) {
      console.error('Failed to load host portal data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingListing(true);

    try {
      await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          city,
          country: 'United States',
          latitude: 36.5552,
          longitude: -121.9233,
          nightlyRate: parseInt(nightlyRate, 10),
          cleaningFee: parseInt(cleaningFee, 10),
          maxGuests: parseInt(maxGuests, 10),
          bedrooms: 2,
          beds: 2,
          bathrooms: 2.0,
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'],
          amenities: ['Fast Wifi', 'Chef Kitchen', 'Scenic Views', 'EV Charger']
        })
      });

      setShowAddModal(false);
      setTitle('');
      setDescription('');
      fetchHostData();
      alert('Listing created and published to marketplace!');
    } catch (err: any) {
      alert(err.message || 'Error creating listing');
    } finally {
      setSubmittingListing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Host Management Console</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your vacation rental listings, monitor guest arrivals, and track booking revenue.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create New Listing
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-neutral-400 font-medium">Loading host console...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Your Properties */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
                <Building className="h-4 w-4 text-rose-500" />
                Active Vacation Listings
              </h2>

              <div className="divide-y divide-neutral-100">
                {listings.map((l) => (
                  <div key={l.id} className="py-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                        <img
                          src={l.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300'}
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 text-sm line-clamp-1">{l.title}</h3>
                        <p className="text-neutral-500">{l.city}, {l.country} &bull; {l.category}</p>
                        <p className="font-semibold text-neutral-800 mt-0.5">${l.nightlyRate}/night &bull; ${l.cleaningFee} cleaning</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      Published
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Guest Reservations */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm h-fit">
            <h2 className="text-base font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-rose-500" />
              Recent Guest Bookings
            </h2>

            {hostBookings.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No reservations received yet.</p>
            ) : (
              <div className="space-y-3">
                {hostBookings.map((b) => (
                  <div key={b.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900">Reservation #{b.id.substring(0, 8)}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[11px] mb-1">
                      {b.checkIn} &rarr; {b.checkOut} ({b.nightsCount} nights)
                    </p>
                    <div className="flex items-center justify-between font-semibold text-neutral-800 text-[11px] pt-1 border-t border-neutral-200">
                      <span>Payout Subtotal</span>
                      <span>${b.baseSubtotal.toLocaleString()} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-neutral-900 mb-1">Onboard New Vacation Rental</h2>
            <p className="text-xs text-neutral-500 mb-4">Publish your property to travelers worldwide.</p>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Property Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Glass Oceanfront Villa"
                  required
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe architecture, scenic features, and amenities..."
                  required
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="Beachfront">Beachfront</option>
                    <option value="Cabins">Cabins</option>
                    <option value="Iconic Cities">Iconic Cities</option>
                    <option value="Desert">Desert</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nightly ($)</label>
                  <input
                    type="number"
                    value={nightlyRate}
                    onChange={(e) => setNightlyRate(e.target.value)}
                    required
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Cleaning ($)</label>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value)}
                    required
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    required
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 font-semibold text-neutral-600 border border-neutral-300 rounded-xl hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingListing}
                  className="flex-1 py-2 font-bold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 disabled:opacity-50"
                >
                  {submittingListing ? 'Creating...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
