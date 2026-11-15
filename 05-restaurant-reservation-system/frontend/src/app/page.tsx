'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '../lib/api';
import {
  Search, MapPin, Calendar, Users, Clock, Utensils,
  Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

function RestaurantSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [city, setCity] = useState(searchParams.get('city') || 'New York');
  const [date, setDate] = useState(searchParams.get('date') || today);
  const [partySize, setPartySize] = useState(searchParams.get('partySize') || '2');

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (cuisine) query.set('cuisine', cuisine);
      if (city) query.set('city', city);
      if (date) query.set('date', date);
      if (partySize) query.set('partySize', partySize);

      const res = await fetchApi(`/restaurants?${query.toString()}`);
      setRestaurants(res.restaurants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (cuisine) query.set('cuisine', cuisine);
    if (city) query.set('city', city);
    if (date) query.set('date', date);
    if (partySize) query.set('partySize', partySize);
    router.push(`/?${query.toString()}`);
  };

  const handleFilterCuisine = (selectedCuisine: string) => {
    setCuisine(selectedCuisine);
    const query = new URLSearchParams(searchParams.toString());
    if (selectedCuisine) {
      query.set('cuisine', selectedCuisine);
    } else {
      query.delete('cuisine');
    }
    router.push(`/?${query.toString()}`);
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="relative bg-wine-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-wine-900">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-400/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Fine Dining & Culinary Destinations
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white mb-4">
            Table Reservations & Waitlist Promotions
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto mb-10">
            Real-time table allocation, combinable party dining, 15-minute turnover sanitization buffers, and automated waitlist promotion.
          </p>

          {/* Search Bar Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-stone-800 max-w-4xl mx-auto text-left border border-stone-200">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-wine-700" />
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. New York, SoHo"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full text-xs font-medium border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-wine-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-wine-700" />
                  Cuisine
                </label>
                <input
                  type="text"
                  placeholder="e.g. Italian, French, Omakase"
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  className="w-full text-xs font-medium border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-wine-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-wine-700" />
                  Dining Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-xs font-medium border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-wine-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-wine-700" />
                  Party Size
                </label>
                <select
                  value={partySize}
                  onChange={e => setPartySize(e.target.value)}
                  className="w-full text-xs font-medium border border-stone-200 rounded-lg px-3 py-2.5 bg-white"
                >
                  <option value="1">1 Diner</option>
                  <option value="2">2 Diners (Couple / 2-top)</option>
                  <option value="4">4 Diners (4-top)</option>
                  <option value="6">6 Diners (6-top)</option>
                  <option value="8">8 Diners (Combined)</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-wine-800 hover:bg-wine-900 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-colors h-[42px]"
                >
                  <Search className="w-4 h-4" />
                  Find Tables
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Cuisine Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-stone-200 text-xs">
          <span className="font-bold text-stone-500 mr-2 uppercase tracking-wider">Cuisines:</span>
          {['', 'Italian', 'French Bistro', 'Japanese Omakase'].map(c => (
            <button
              key={c || 'all'}
              onClick={() => handleFilterCuisine(c)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                cuisine === c
                  ? 'bg-wine-900 text-white shadow-xs'
                  : 'bg-white border border-stone-300 text-stone-700 hover:border-stone-400'
              }`}
            >
              {c ? c : 'All Cuisines'}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            {cuisine ? `${cuisine} Dining in ${city}` : 'Available Dining Destinations'}
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'} found for party of {partySize}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400 text-sm font-medium">
            Computing table capacities and floor plan schedules for {date}...
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
            <p className="text-stone-600 font-medium text-sm mb-2">No dining tables match your requested search.</p>
            <p className="text-stone-400 text-xs">Try selecting a different party size or clearing cuisine filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(rest => (
              <div
                key={rest.id}
                className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-stone-200 flex flex-col group"
              >
                {/* Photo Gallery Thumbnail */}
                <div className="relative h-56 overflow-hidden bg-stone-100">
                  <img
                    src={rest.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 shadow-md">
                    {rest.priceTier}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-wine-950/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {rest.neighborhood}, {rest.city}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] uppercase font-bold text-wine-700 tracking-wider">{rest.cuisine}</span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-stone-900 mb-1 group-hover:text-wine-800 transition-colors">
                      {rest.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                      {rest.description}
                    </p>

                    {/* Time Slot Buttons */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-2 tracking-wider">
                        Available Dinner Times ({date})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rest.timeSlots?.slice(0, 5).map((slot: any) => (
                          <Link
                            key={slot.timeSlot}
                            href={`/restaurants/${rest.id}?date=${date}&partySize=${partySize}&time=${slot.timeSlot}`}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                              slot.isAvailable
                                ? 'bg-wine-900 text-white hover:bg-wine-800 shadow-xs'
                                : 'bg-stone-100 text-stone-400 border border-stone-200 hover:text-wine-700'
                            }`}
                          >
                            {slot.timeSlot}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {rest.openTime} &ndash; {rest.closeTime}
                    </span>

                    <Link
                      href={`/restaurants/${rest.id}?date=${date}&partySize=${partySize}`}
                      className="inline-flex items-center gap-1 bg-stone-100 hover:bg-wine-900 hover:text-white text-stone-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      View Table Layout
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reliability & Features Banner */}
      <section className="bg-stone-100 border-t border-stone-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-wine-600/10 text-wine-800 rounded-xl">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm mb-1">Dynamic Table Merging</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Adjacent combinable 2-top and 4-top tables automatically merge to seat large dinner parties when single tables are full.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-wine-600/10 text-wine-800 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm mb-1">15-Minute Turnover Buffer</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every table allocation enforces a mandatory 15-minute buffer between seatings for table sanitization and transition.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-wine-600/10 text-wine-800 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm mb-1">Automated Waitlist Promotion</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Cancellations instantly trigger priority waitlist promotions, granting waitlisted diners a 15-minute exclusive reservation claim window.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading fine dining restaurants...</div>}>
      <RestaurantSearchContent />
    </Suspense>
  );
}
