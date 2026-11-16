'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Airport, Itinerary, Booking, fetchApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import {
  Plane,
  ArrowRight,
  Clock,
  Calendar,
  Users,
  ShieldAlert,
  CheckCircle,
  Ticket,
  AlertTriangle,
  X,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function FlightBookingPortal() {
  const { user, token } = useAuth();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [origin, setOrigin] = useState('SFO');
  const [destination, setDestination] = useState('JFK');
  const [date, setDate] = useState('2026-12-15');
  const [cabinClass, setCabinClass] = useState<'ECONOMY' | 'BUSINESS'>('ECONOMY');
  const [passengers, setPassengers] = useState(1);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Booking & Seat Modal State
  const [selectedItin, setSelectedItin] = useState<Itinerary | null>(null);
  const [paxForm, setPaxForm] = useState({
    firstName: 'David',
    lastName: 'Sterling',
    passportNumber: 'PASS-789012',
    dateOfBirth: '1985-06-20',
    seatNumber: '14C'
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Available seats for interactive picker
  const AVAILABLE_SEATS = ['14A', '14B', '14C', '14D', '15A', '15B', '15C', '15D', '16A', '16B'];

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const data = await fetchApi('/airports');
        setAirports(data.airports || []);
        handleSearch();
      } catch (err) {
        console.error(err);
      }
    };
    loadInitial();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const data = await fetchApi(
        `/flights/search?origin=${origin}&destination=${destination}&date=${date}&cabinClass=${cabinClass}&passengers=${passengers}`
      );
      setItineraries(data.itineraries || []);

      if (token) {
        const bData = await fetchApi('/bookings/my', {}, token);
        setMyBookings(bData.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItin || !token) return;

    try {
      setIsBooking(true);
      setBookingError(null);

      // 1. Create booking hold
      const holdRes = await fetchApi(
        '/bookings',
        {
          method: 'POST',
          body: JSON.stringify({
            flightId: selectedItin.legs[0].id,
            flightIds: selectedItin.legs.map(l => l.id),
            cabinClass,
            passengers: [paxForm]
          })
        },
        token
      );

      // 2. Pay and ticket immediately (demonstration checkout flow)
      const ticketRes = await fetchApi(
        `/bookings/${holdRes.booking.id}/pay`,
        { method: 'POST' },
        token
      );

      setConfirmedBooking(ticketRes.booking);
      handleSearch();
    } catch (err: any) {
      setBookingError(err.message || 'Seat collision or capacity exhausted');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!token) return;
    try {
      await fetchApi(`/bookings/${id}/cancel`, { method: 'POST' }, token);
      alert('Booking cancelled and seat inventory restored.');
      handleSearch();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Demonstration Disclaimer Callout */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold block text-sm text-amber-900 mb-0.5">Demonstration Airline Inventory Mode</span>
            Flight numbers, seat maps, and e-tickets are generated solely for application demonstration and architectural testing. No genuine airline reservations are created.
          </div>
        </div>

        {/* Search Bar Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">From (Origin)</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                >
                  {airports.map(a => (
                    <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">To (Destination)</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                >
                  {airports.map(a => (
                    <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cabin Class</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-sky-500"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Plane className="w-4 h-4" />
                  <span>Search Flights</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* User Bookings Drawer / Row */}
        {myBookings.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-sky-600" />
              <span>Your Demonstration E-Tickets</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map(b => (
                <div key={b.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      PNR: {b.pnrLocator}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Flight: {b.flightId} • Seats: {b.seatNumbers?.join(', ') || 'Assigned at gate'}
                    </p>
                    <p className="text-xs font-bold text-sky-700">Total Fare: ${b.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full">
                      {b.status}
                    </span>
                    {b.status === 'TICKETED' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itinerary Results List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900">Available Flight Itineraries</h2>
            <span className="text-xs text-slate-500 font-semibold">{itineraries.length} options found</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Searching demonstration airline schedules...</div>
          ) : itineraries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500">
              No flights found matching {origin} to {destination} on {date}. Try SFO to JFK on 2026-12-15.
            </div>
          ) : (
            itineraries.map((itin) => (
              <div
                key={itin.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Timeline display */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      itin.type === 'DIRECT' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {itin.type === 'DIRECT' ? 'Nonstop' : `1 Stop (${itin.layoverAirport})`}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {itin.legs.map(l => l.airlineName).join(' / ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{itin.departureTime}</p>
                      <p className="text-xs font-bold text-slate-400">{itin.originCode}</p>
                    </div>

                    <div className="flex-1 max-w-[200px] text-center space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{Math.floor(itin.totalDurationMinutes / 60)}h {itin.totalDurationMinutes % 60}m</span>
                      </p>
                      <div className="h-0.5 bg-slate-300 relative">
                        <Plane className="w-3.5 h-3.5 text-sky-600 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                      </div>
                      {itin.connectionMinutes && (
                        <p className="text-[10px] font-bold text-amber-600">
                          {Math.floor(itin.connectionMinutes / 60)}h {itin.connectionMinutes % 60}m layover in {itin.layoverAirport}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-2xl font-black text-slate-900">{itin.arrivalTime}</p>
                      <p className="text-xs font-bold text-slate-400">{itin.destinationCode}</p>
                    </div>
                  </div>
                </div>

                {/* Price & Book Action */}
                <div className="text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0 space-y-2 w-full md:w-auto">
                  <div>
                    <span className="text-2xl font-black text-sky-600">${itin.totalPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 block">per passenger</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItin(itin);
                      setConfirmedBooking(null);
                      setBookingError(null);
                    }}
                    className="w-full md:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Select & Reserve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Booking Drawer Modal */}
      {selectedItin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-600">Demonstration Reservation</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedItin.originCode} → {selectedItin.destinationCode} ({selectedItin.type})
                </h3>
              </div>
              <button onClick={() => setSelectedItin(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {confirmedBooking ? (
              /* Demonstration E-Ticket View */
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                  <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900">Demonstration E-Ticket Issued</h4>
                  <p className="text-xs text-emerald-700">Simulated boarding pass generated with confirmed seat assignment.</p>
                </div>

                {/* E-Ticket Card */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-lg">
                    DEMO ONLY - NOT A REAL BOARDING PASS
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">BOOKING REFERENCE</span>
                      <p className="text-xl font-mono font-black text-sky-700">{confirmedBooking.pnrLocator}</p>
                    </div>
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-slate-400 block font-semibold">PASSENGER</span>
                      <strong className="text-slate-800">{paxForm.firstName} {paxForm.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">SEAT</span>
                      <strong className="text-sky-600 text-sm">{paxForm.seatNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">CABIN CLASS</span>
                      <strong className="text-slate-800">{confirmedBooking.cabinClass}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">TOTAL AMOUNT</span>
                      <strong className="text-slate-800">${confirmedBooking.totalAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItin(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={paxForm.firstName}
                      onChange={(e) => setPaxForm({ ...paxForm, firstName: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={paxForm.lastName}
                      onChange={(e) => setPaxForm({ ...paxForm, lastName: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Passport / ID Number</label>
                  <input
                    type="text"
                    value={paxForm.passportNumber}
                    onChange={(e) => setPaxForm({ ...paxForm, passportNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-sky-500"
                    required
                  />
                </div>

                {/* Seat Assignment Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Seat Assignment</label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVAILABLE_SEATS.map(seat => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => setPaxForm({ ...paxForm, seatNumber: seat })}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${
                          paxForm.seatNumber === seat
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Authoritative Fare Snapshot */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Itinerary Fare</span>
                    <span>${selectedItin.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Carrier Fuel Surcharge (15%)</span>
                    <span>${Math.round(selectedItin.totalPrice * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Aviation Facility & Security Taxes</span>
                    <span>$60</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
                    <span>Total Ticket Charge</span>
                    <span className="text-sky-600">
                      ${(selectedItin.totalPrice + Math.round(selectedItin.totalPrice * 0.15) + 60).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItin(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isBooking ? 'Processing...' : 'Issue Demonstration E-Ticket'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
