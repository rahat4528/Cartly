'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Building, Users, Calendar, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

function HotelierPortalContent() {
  const { user, login } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('htl_001');
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const initData = async () => {
    setLoading(true);
    try {
      // Switch/login as hotelier if needed
      if (!user || user.role !== 'HOTELIER') {
        await login('hotelier@cartly.local', 'Pass123!');
      }

      const hotelsRes = await fetchApi('/hotels');
      setHotels(hotelsRes.hotels || []);

      if (selectedHotelId) {
        const calRes = await fetchApi(`/hotelier/hotels/${selectedHotelId}/calendar`);
        setCalendarData(calRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [user, selectedHotelId]);

  const handleStatusChange = async (resvId: string, newStatus: 'CHECKED_IN' | 'COMPLETED') => {
    setUpdating(resvId);
    try {
      await fetchApi(`/hotelier/reservations/${resvId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      // Refresh calendar
      const calRes = await fetchApi(`/hotelier/hotels/${selectedHotelId}/calendar`);
      setCalendarData(calRes);
    } catch (err: any) {
      alert(err.message || 'Status change failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-sand-300 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Hospitality Operations</span>
          <h1 className="text-2xl font-serif font-bold text-navy-900">Hotelier Occupancy & Guest Portal</h1>
        </div>

        {/* Hotel Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Property:</span>
          <select
            value={selectedHotelId}
            onChange={e => setSelectedHotelId(e.target.value)}
            className="text-xs font-bold bg-white border border-sand-300 rounded-lg px-3 py-2 text-navy-900 shadow-xs"
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading hotelier operations dashboard...</div>
      ) : (
        <div className="space-y-8">
          {/* Room Type Inventory Cards */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">Room Type Capacity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendarData?.roomTypes?.map((rt: any) => (
                <div key={rt.id} className="bg-white p-5 rounded-2xl border border-sand-300 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif font-bold text-base text-navy-900">{rt.name}</h3>
                    <span className="bg-sand-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded">
                      ${rt.basePricePerNight}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">{rt.bedType} &middot; Max {rt.maxGuests} Guests</div>
                  <div className="flex justify-between items-center text-xs pt-3 border-t border-sand-200">
                    <span className="text-slate-500">Physical Rooms:</span>
                    <span className="font-bold text-navy-900 text-sm">{rt.totalRooms} Rooms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Reservations & Guest Actions */}
          <div className="bg-white rounded-2xl border border-sand-300 p-6 shadow-xs">
            <h2 className="text-lg font-serif font-bold text-navy-900 mb-4">
              Active Guests & Reservations ({calendarData?.activeReservations?.length || 0})
            </h2>

            {!calendarData?.activeReservations || calendarData.activeReservations.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No active guest reservations currently on record for this property.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-sand-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Voucher / Guest</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Rooms</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200">
                    {calendarData.activeReservations.map((resv: any) => (
                      <tr key={resv.id} className="hover:bg-sand-50/50">
                        <td className="p-3">
                          <div className="font-mono font-bold text-navy-900">{resv.voucherCode}</div>
                          <div className="text-[11px] text-slate-500">{resv.guestName} ({resv.guestEmail})</div>
                        </td>
                        <td className="p-3 font-medium">
                          {resv.checkInDate} &rarr; {resv.checkOutDate} ({resv.nightsCount}n)
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {resv.roomsCount}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            resv.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : resv.status === 'CHECKED_IN'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {resv.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          ${resv.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          {resv.status === 'CONFIRMED' && (
                            <button
                              disabled={updating === resv.id}
                              onClick={() => handleStatusChange(resv.id, 'CHECKED_IN')}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors"
                            >
                              Check In
                            </button>
                          )}
                          {resv.status === 'CHECKED_IN' && (
                            <button
                              disabled={updating === resv.id}
                              onClick={() => handleStatusChange(resv.id, 'COMPLETED')}
                              className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HotelierPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading hotelier portal...</div>}>
      <HotelierPortalContent />
    </Suspense>
  );
}
