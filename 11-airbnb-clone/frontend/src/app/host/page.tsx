'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Booking, Listing, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import {
  Home,
  PlusCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  X
} from 'lucide-react';

export default function HostDashboard() {
  const { user, token, quickSwitch } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // New Listing Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: 'Modern Desert Dome with Stargazing Skylight',
    description: 'Geodesic dome situated in serene Joshua Tree desert with panoramic dark-sky stargazing views.',
    category: 'Countryside',
    location: 'Joshua Tree, California, United States',
    city: 'Joshua Tree',
    country: 'United States',
    latitude: 34.1347,
    longitude: -116.3131,
    nightlyRate: 275,
    cleaningFee: 95,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1.0,
    images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'],
    amenities: ['Stargazing Skylight', 'Outdoor Fire Pit', 'AC', 'Wifi']
  });

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const lData = await fetchApi('/listings');
      setListings(lData.listings || []);

      const bData = await fetchApi('/host/bookings', {}, token);
      setHostBookings(bData.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'HOST') {
      quickSwitch('HOST');
    }
    loadData();
  }, [token, user?.role]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await fetchApi(
        '/listings',
        {
          method: 'POST',
          body: JSON.stringify(form)
        },
        token
      );
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish listing');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
              <Home className="w-7 h-7 text-rose-500" />
              <span>Host Management Center</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">Manage vacation properties, monitor confirmed guest stays, and review payouts.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Listing</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-neutral-400">Total Listings</span>
            <p className="text-3xl font-black text-neutral-900 mt-2">{listings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-neutral-400">Guest Bookings</span>
            <p className="text-3xl font-black text-neutral-900 mt-2">{hostBookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-neutral-400">Gross Reservation Volume</span>
            <p className="text-3xl font-black text-emerald-600 mt-2">
              ${hostBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Guest Reservations Queue */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">Incoming Guest Reservations</h2>
          {hostBookings.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4">No reservations booked on your listings yet.</p>
          ) : (
            <div className="space-y-3">
              {hostBookings.map(b => (
                <div key={b.id} className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-neutral-800">{b.listingTitle || b.listingId}</span>
                    <p className="text-xs text-neutral-500">{b.checkIn} → {b.checkOut} ({b.nightsCount} nights) • {b.guestCount} guests</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-neutral-900">${b.totalPrice.toLocaleString()}</span>
                    <span className={`block text-[10px] font-bold uppercase mt-0.5 ${
                      b.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-neutral-500'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-neutral-900">Publish Vacation Listing</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Listing Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-rose-500"
                  >
                    <option value="Beachfront">Beachfront</option>
                    <option value="Cabins">Cabins</option>
                    <option value="Iconic Cities">Iconic Cities</option>
                    <option value="Countryside">Countryside</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Nightly Rate ($)</label>
                  <input
                    type="number"
                    value={form.nightlyRate}
                    onChange={(e) => setForm({ ...form, nightlyRate: Number(e.target.value) })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Cleaning Fee ($)</label>
                  <input
                    type="number"
                    value={form.cleaningFee}
                    onChange={(e) => setForm({ ...form, cleaningFee: Number(e.target.value) })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-xl hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Publish Accommodation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
