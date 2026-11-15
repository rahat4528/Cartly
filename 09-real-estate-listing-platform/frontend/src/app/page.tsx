'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../lib/auth-context';
import { Property, Tour, fetchApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import {
  Compass,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Building,
  Home
} from 'lucide-react';

function RealtyMarketplace() {
  const { user, token, quickSwitch } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedSpatialFilter, setSelectedSpatialFilter] = useState<string>('SF_RADIUS');
  const [propertyType, setPropertyType] = useState<string>('ALL');
  const [minBeds, setMinBeds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Active modals
  const [activeHistoryProperty, setActiveHistoryProperty] = useState<Property | null>(null);
  const [tourProperty, setTourProperty] = useState<Property | null>(null);
  const [tourDate, setTourDate] = useState('2026-12-20');
  const [tourTime, setTourTime] = useState('14:00');
  const [tourType, setTourType] = useState<'IN_PERSON' | 'VIRTUAL_WALKTHROUGH'>('IN_PERSON');
  const [isScheduling, setIsScheduling] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);
  const [tourSuccess, setTourSuccess] = useState<Tour | null>(null);

  // Load properties based on spatial filter
  useEffect(() => {
    setIsLoading(true);
    let url = '/properties?';
    const params = new URLSearchParams();

    if (propertyType !== 'ALL') params.set('propertyType', propertyType);
    if (minBeds > 0) params.set('bedrooms', minBeds.toString());

    if (selectedSpatialFilter === 'SF_BOUNDS') {
      params.set('minLat', '37.70');
      params.set('maxLat', '37.85');
      params.set('minLng', '-122.50');
      params.set('maxLng', '-122.35');
    } else if (selectedSpatialFilter === 'SF_RADIUS') {
      params.set('lat', '37.7749');
      params.set('lng', '-122.4194');
      params.set('radiusKm', '15');
    }

    url += params.toString();

    fetchApi<{ properties: Property[] }>(url)
      .then((data) => setProperties(data.properties))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [selectedSpatialFilter, propertyType, minBeds]);

  const handleScheduleTour = async () => {
    if (!user) {
      alert('Please sign in as a buyer.');
      await quickSwitch('buyer');
      return;
    }
    if (!tourProperty) return;

    setIsScheduling(true);
    setTourError(null);

    try {
      const res = await fetchApi<{ tour: Tour }>(
        `/properties/${tourProperty.id}/tours`,
        {
          method: 'POST',
          body: JSON.stringify({ tourDate, tourTime, tourType }),
        },
        token
      );
      setTourSuccess(res.tour);
    } catch (err: any) {
      setTourError(err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Marquee */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-900/40 text-white p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Geospatial Bounding Box & Haversine Proximity Search</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Curated Architectural Residences.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Verified MLS agent listings, immutable historical price audit ledgers, and conflict-free private tour reservations.
            </p>
          </div>
        </div>

        {/* Spatial Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Geospatial Boundary:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'SF_RADIUS', label: '15km Radius (SF Downtown)' },
                  { key: 'SF_BOUNDS', label: 'San Francisco Bounding Box' },
                  { key: 'ALL', label: 'All Bay Area Coordinates' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSelectedSpatialFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedSpatialFilter === f.key
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Beds and Type */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Property Types</option>
                <option value="SINGLE_FAMILY">Single Family</option>
                <option value="CONDO">Condo</option>
              </select>

              <select
                value={minBeds}
                onChange={(e) => setMinBeds(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value={0}>Any Bedrooms</option>
                <option value={2}>2+ Beds</option>
                <option value={3}>3+ Beds</option>
                <option value={4}>4+ Beds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spatial Pins Map Representation & Property Cards */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-6 border border-slate-800 text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono">
                {properties.length}
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Spatial Coordinates Located</span>
                <span className="text-[11px] text-slate-400">
                  Computed via spherical great-circle distance within queried bounding parameters.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-amber-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Compass className="w-3.5 h-3.5 animate-spin" />
              <span>Center Lat: 37.7749° N, Lng: -122.4194° W</span>
            </div>
          </div>

          {/* Properties Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Home className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No properties found matching spatial criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((p) => {
                const latestPriceCut = p.priceHistory && p.priceHistory.length > 0 ? p.priceHistory[0] : null;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Property Image */}
                      <div className="relative h-60 bg-slate-100 overflow-hidden">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {p.propertyType.replace('_', ' ')}
                        </span>
                        {p.distanceKm !== undefined && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur text-[10px] font-bold text-emerald-300">
                            {p.distanceKm.toFixed(1)} km from center
                          </span>
                        )}
                        <div className="absolute bottom-3 left-4 text-white">
                          <span className="text-2xl font-extrabold tracking-tight">
                            ${p.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-6 space-y-3">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {p.address}, {p.city}, {p.state} {p.zipCode}
                        </p>

                        {/* Specs Pill Row */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs text-slate-700 font-semibold">
                          <span className="flex items-center space-x-1">
                            <Bed className="w-4 h-4 text-amber-600" />
                            <span>{p.bedrooms} Beds</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Bath className="w-4 h-4 text-amber-600" />
                            <span>{p.bathrooms} Baths</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Maximize2 className="w-4 h-4 text-amber-600" />
                            <span>{p.sqft.toLocaleString()} sqft</span>
                          </span>
                        </div>

                        {/* Price Cut Alert if recorded in history */}
                        {latestPriceCut && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center space-x-2">
                            <TrendingDown className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>
                              Price Improved: -${Math.abs(latestPriceCut.priceChangeAmount).toLocaleString()} (
                              {latestPriceCut.priceChangePercent}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveHistoryProperty(p)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <History className="w-3.5 h-3.5 text-amber-600" />
                        <span>Price History ({p.priceHistory?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => {
                          setTourProperty(p);
                          setTourSuccess(null);
                          setTourError(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        Schedule Tour
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Price History Modal */}
      {activeHistoryProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Immutable Price Change Ledger
                </h3>
              </div>
              <button
                onClick={() => setActiveHistoryProperty(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800">{activeHistoryProperty.title}</div>
              <div className="text-[11px] text-slate-500">{activeHistoryProperty.address}</div>
            </div>

            {(!activeHistoryProperty.priceHistory || activeHistoryProperty.priceHistory.length === 0) ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No historical price adjustments recorded for this property.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-3">
                {activeHistoryProperty.priceHistory.map((h) => (
                  <div key={h.id} className="pt-3 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-slate-500">{h.date}</span>
                      <span
                        className={`font-bold ${
                          h.priceChangeAmount < 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {h.priceChangePercent}% (${h.priceChangeAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>${h.previousPrice.toLocaleString()} &rarr;</span>
                      <span className="font-bold font-mono">${h.newPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">&ldquo;{h.reason}&rdquo;</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tour Scheduling Modal */}
      {tourProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-extrabold text-slate-900">Schedule Private Viewing</h3>
              </div>
              <button
                onClick={() => setTourProperty(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900">{tourProperty.title}</div>
              <div className="text-[11px] text-slate-500">{tourProperty.address}</div>
            </div>

            {tourError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{tourError}</span>
              </div>
            )}

            {tourSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Viewing Appointment Confirmed!</span>
                </div>
                <p>
                  Scheduled for {tourSuccess.tourDate} at {tourSuccess.tourTime} ({tourSuccess.tourType}). The listing agent has been notified.
                </p>
                <button
                  onClick={() => setTourProperty(null)}
                  className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Date</label>
                  <input
                    type="date"
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Time Slot</label>
                  <select
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:30">3:30 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tour Experience</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTourType('IN_PERSON')}
                      className={`p-2 rounded-xl text-center border font-bold ${
                        tourType === 'IN_PERSON'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      In-Person Tour
                    </button>
                    <button
                      type="button"
                      onClick={() => setTourType('VIRTUAL_WALKTHROUGH')}
                      className={`p-2 rounded-xl text-center border font-bold ${
                        tourType === 'VIRTUAL_WALKTHROUGH'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Virtual Video
                    </button>
                  </div>
                </div>

                <button
                  disabled={isScheduling}
                  onClick={handleScheduleTour}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold transition-colors shadow-md"
                >
                  {isScheduling ? 'Reserving Tour Slot...' : 'Confirm Appointment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading CartlyRealty...</div>}>
      <RealtyMarketplace />
    </Suspense>
  );
}
