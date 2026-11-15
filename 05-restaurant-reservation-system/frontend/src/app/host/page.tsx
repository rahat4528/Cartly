'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Utensils, Users, Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

function HostPortalContent() {
  const { user, login } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('rst_001');
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const initData = async () => {
    setLoading(true);
    try {
      if (!user || user.role !== 'HOST') {
        await login('host@cartly.local', 'Pass123!');
      }

      const restRes = await fetchApi('/restaurants');
      setRestaurants(restRes.restaurants || []);

      if (selectedRestId) {
        const calRes = await fetchApi(`/host/restaurants/${selectedRestId}/timeline`);
        setTimelineData(calRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [user, selectedRestId]);

  const handleStatusChange = async (resvId: string, newStatus: 'SEATED' | 'COMPLETED') => {
    setUpdating(resvId);
    try {
      await fetchApi(`/host/reservations/${resvId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const calRes = await fetchApi(`/host/restaurants/${selectedRestId}/timeline`);
      setTimelineData(calRes);
    } catch (err: any) {
      alert(err.message || 'Status change failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-stone-300 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-wine-700 tracking-wider">Host & Maitre D' Operations</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Floor Plan Occupancy & Guest Seating</h1>
        </div>

        {/* Restaurant Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500">Restaurant:</span>
          <select
            value={selectedRestId}
            onChange={e => setSelectedRestId(e.target.value)}
            className="text-xs font-bold bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 shadow-xs"
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.neighborhood})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">Loading floor plan timeline...</div>
      ) : (
        <div className="space-y-8">
          {/* Table Capacity Matrix */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">Floor Plan Tables</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {timelineData?.tables?.map((tbl: any) => (
                <div key={tbl.id} className="bg-white p-3.5 rounded-xl border border-stone-300 shadow-xs text-center">
                  <div className="font-serif font-bold text-lg text-wine-900">{tbl.tableNumber}</div>
                  <div className="text-[11px] font-semibold text-stone-600 mb-1">{tbl.seatingZone}</div>
                  <div className="text-[10px] text-stone-400">
                    Cap: {tbl.minCapacity}&ndash;{tbl.maxCapacity} {tbl.isCombinable && '(Combinable)'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Guest Reservations */}
          <div className="bg-white rounded-2xl border border-stone-300 p-6 shadow-xs">
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-4">
              Tonight's Reservations ({timelineData?.reservations?.length || 0})
            </h2>

            {!timelineData?.reservations || timelineData.reservations.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">No reservations currently booked for tonight's service.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Code / Diner</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Party</th>
                      <th className="p-3">Table(s)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-lg text-right">Host Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {timelineData.reservations.map((resv: any) => (
                      <tr key={resv.id} className="hover:bg-stone-50/50">
                        <td className="p-3">
                          <div className="font-mono font-bold text-wine-900">{resv.reservationCode}</div>
                          <div className="text-[11px] text-stone-500">{resv.guestName}</div>
                        </td>
                        <td className="p-3 font-semibold text-stone-800">
                          {resv.timeSlot} ({resv.durationMinutes}m)
                        </td>
                        <td className="p-3 font-semibold text-stone-800">
                          {resv.partySize} Diners
                        </td>
                        <td className="p-3 font-bold text-wine-900">
                          {resv.tableNumbers?.join(' + ') || 'Assigned'}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            resv.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : resv.status === 'SEATED'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}>
                            {resv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {resv.status === 'CONFIRMED' && (
                            <button
                              disabled={updating === resv.id}
                              onClick={() => handleStatusChange(resv.id, 'SEATED')}
                              className="bg-wine-900 hover:bg-wine-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors"
                            >
                              Seat Table
                            </button>
                          )}
                          {resv.status === 'SEATED' && (
                            <button
                              disabled={updating === resv.id}
                              onClick={() => handleStatusChange(resv.id, 'COMPLETED')}
                              className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors"
                            >
                              Complete Dining
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

export default function HostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading host operations...</div>}>
      <HostPortalContent />
    </Suspense>
  );
}
