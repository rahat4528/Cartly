'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '../lib/api';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function HotelSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tomorrow as default checkIn
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = tomorrow.toISOString().split('T')[0];

  // 3 days later as default checkOut
  const future = new Date();
  future.setDate(future.getDate() + 4);
  const defaultCheckOut = future.toISOString().split('T')[0];

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || defaultCheckOut);
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [rooms, setRooms] = useState(searchParams.get('rooms') || '1');

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (city) query.set('city', city);
      if (checkIn) query.set('checkIn', checkIn);
      if (checkOut) query.set('checkOut', checkOut);
      if (guests) query.set('guests', guests);
      if (rooms) query.set('rooms', rooms);

      const res = await fetchApi(`/hotels?${query.toString()}`);
      setHotels(res.hotels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (city) query.set('city', city);
    if (checkIn) query.set('checkIn', checkIn);
    if (checkOut) query.set('checkOut', checkOut);
    if (guests) query.set('guests', guests);
    if (rooms) query.set('rooms', rooms);
    router.push(`/?${query.toString()}`);
  };

  const handleFilterCity = (selectedCity: string) => {
    setCity(selectedCity);
    const query = new URLSearchParams(searchParams.toString());
    if (selectedCity) {
      query.set('city', selectedCity);
    } else {
      query.delete('city');
    }
    router.push(`/?${query.toString()}`);
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="relative bg-navy-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-sand-300">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Luxury & Boutique Accommodations
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white mb-4">
            Remarkable Stays, Guaranteed Availability
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-10">
            Real-time multi-night room inventory locks, transparent seasonal rate calculation, and instant 10-minute hold protection.
          </p>

          {/* Search Form Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-800 max-w-4xl mx-auto text-left border border-sand-200">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. Miami, Zurich, Kyoto"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-navy-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-navy-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-700" />
                  Guests & Rooms
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={guests}
                    onChange={e => setGuests(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2 py-2.5 bg-white"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                  </select>
                  <select
                    value={rooms}
                    onChange={e => setRooms(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2 py-2.5 bg-white"
                  >
                    <option value="1">1 Room</option>
                    <option value="2">2 Rooms</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-colors h-[42px]"
                >
                  <Search className="w-4 h-4" />
                  Find Stays
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Destination Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-sand-200 text-xs">
          <span className="font-bold text-slate-500 mr-2 uppercase tracking-wider">Quick Filter:</span>
          {['', 'Miami', 'Zurich', 'Kyoto'].map(c => (
            <button
              key={c || 'all'}
              onClick={() => handleFilterCity(c)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                city === c
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-white border border-sand-300 text-slate-700 hover:border-slate-400'
              }`}
            >
              {c ? c : 'All Destinations'}
            </button>
          ))}
        </div>
      </div>

      {/* Property Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-navy-900">
            {city ? `Accommodations in ${city}` : 'Featured Luxury Stays'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {hotels.length} {hotels.length === 1 ? 'property' : 'properties'} found
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            Checking real-time room availability across {checkIn} &rarr; {checkOut}...
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-sand-200">
            <p className="text-slate-600 font-medium text-sm mb-2">No hotels match your requested dates and filters.</p>
            <p className="text-slate-400 text-xs">Try selecting alternate dates or clearing destination filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map(hotel => (
              <div
                key={hotel.id}
                className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-sand-200 flex flex-col group"
              >
                {/* Photo Gallery Thumbnail */}
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-md flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {hotel.starRating.toFixed(1)}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-navy-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {hotel.city}, {hotel.country}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-navy-900 mb-1 group-hover:text-amber-700 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {hotel.description}
                    </p>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hotel.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-sand-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-sand-200">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-4 border-t border-sand-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Starting From</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif font-bold text-xl text-navy-900">
                          ${hotel.startingPricePerNight.toFixed(0)}
                        </span>
                        <span className="text-xs text-slate-500">/ night</span>
                      </div>
                    </div>

                    <Link
                      href={`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}
                      className="inline-flex items-center gap-1 bg-navy-900 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs transition-colors"
                    >
                      View Rooms
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reliability Banner */}
      <section className="bg-sand-100 border-t border-sand-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600/10 text-amber-800 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy-900 text-sm mb-1">Atomic Double-Booking Prevention</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-night availability locks guarantee that no two guests can ever book the same physical room across overlapping dates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600/10 text-amber-800 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy-900 text-sm mb-1">10-Minute Hold Window</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rooms are temporarily held while you review your itemized cost breakdown and enter details. Hold automatically releases if checkout times out.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600/10 text-amber-800 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy-900 text-sm mb-1">Seasonal & Weekend Transparency</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authoritative server price calculations detail nightly rates, seasonal multipliers, weekend surcharges, and local taxes.
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading hospitality catalog...</div>}>
      <HotelSearchContent />
    </Suspense>
  );
}
