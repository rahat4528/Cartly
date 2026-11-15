'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Property, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import { Briefcase, Building2, TrendingDown, CheckCircle2, ShieldAlert, Edit3 } from 'lucide-react';

function AgentListingPortal() {
  const { user, token, quickSwitch } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [priceReason, setPriceReason] = useState<string>('Competitive market repricing');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const loadProperties = () => {
    setIsLoading(true);
    fetchApi<{ properties: Property[] }>('/properties?includeAllStatus=true')
      .then((data) => setProperties(data.properties))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleUpdatePrice = async () => {
    if (!editingProperty || !token) return;

    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      await fetchApi(
        `/properties/${editingProperty.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            price: newPrice,
            priceChangeReason: priceReason,
          }),
        },
        token
      );
      setUpdateMsg('Asking price updated and recorded in immutable history ledger.');
      setEditingProperty(null);
      loadProperties();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (propertyId: string, status: string) => {
    if (!token) return;
    try {
      await fetchApi(
        `/properties/${propertyId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
        token
      );
      loadProperties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isAgent = user?.role === 'REAL_ESTATE_AGENT' || user?.role === 'PLATFORM_ADMIN';

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">MLS Agent Listing Portal</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage luxury portfolio listings, initiate price adjustments, and advance contract status.
            </p>
          </div>

          {!isAgent && (
            <button
              onClick={() => quickSwitch('agent')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Switch to Licensed Agent Role
            </button>
          )}
        </div>

        {updateMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateMsg}</span>
          </div>
        )}

        {/* Properties list */}
        {isLoading ? (
          <div className="h-40 bg-white rounded-3xl animate-pulse border border-slate-200" />
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No active listings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((p) => {
              const isOwner = user?.id === p.agentId || user?.role === 'PLATFORM_ADMIN';

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">{p.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'UNDER_CONTRACT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {p.address}, {p.city} • Asking: <span className="font-bold text-slate-900">${p.price.toLocaleString()}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Agent ID: <span className="font-mono">{p.agentId}</span>{' '}
                      {isOwner ? (
                        <span className="text-emerald-600 font-bold">(You are Listing Agent)</span>
                      ) : (
                        <span className="text-red-500 font-bold">(Managed by Peer Agent)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={!isOwner}
                      onClick={() => {
                        setEditingProperty(p);
                        setNewPrice(p.price);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Adjust Price</span>
                    </button>

                    {p.status === 'PUBLISHED' && (
                      <button
                        disabled={!isOwner}
                        onClick={() => handleStatusChange(p.id, 'UNDER_CONTRACT')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        Mark Under Contract
                      </button>
                    )}

                    {p.status === 'UNDER_CONTRACT' && (
                      <button
                        disabled={!isOwner}
                        onClick={() => handleStatusChange(p.id, 'SOLD')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        Mark Sold
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Adjust Price Modal */}
        {editingProperty && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Adjust Price for {editingProperty.title}
              </h3>
              <p className="text-xs text-slate-500">
                This modification will automatically record an immutable ledger entry in the property&apos;s public price history.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Asking Price ($)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reason for Price Shift</label>
                  <input
                    type="text"
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    placeholder="e.g. Competitive market reduction"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    disabled={isUpdating}
                    onClick={handleUpdatePrice}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    {isUpdating ? 'Saving...' : 'Commit Price Change'}
                  </button>
                  <button
                    onClick={() => setEditingProperty(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading agent portal...</div>}>
      <AgentListingPortal />
    </Suspense>
  );
}
