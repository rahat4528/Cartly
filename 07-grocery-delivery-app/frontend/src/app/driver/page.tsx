'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Order, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import { Truck, ShoppingBag, CheckCircle2, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

function DriverFulfillment() {
  const { user, token, quickSwitch } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAllOrders = () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    // For demo/driver purposes, load recent orders
    fetchApi<{ orders: Order[] }>('/orders/my-orders', {}, token)
      .then((data) => setOrders(data.orders))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAllOrders();
  }, [token]);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: string | null = null;
    if (currentStatus === 'PLACED') nextStatus = 'PICKING';
    else if (currentStatus === 'PICKING') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';

    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      await fetchApi(
        `/orders/${orderId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        },
        token
      );
      loadAllOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const isDriverOrAdmin = user?.role === 'PICKER_DRIVER' || user?.role === 'STORE_ADMIN';

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <Truck className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">Fulfillment & Delivery Hub</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Picker assembly line & driver dispatch console for supermarket orders.
            </p>
          </div>

          {!isDriverOrAdmin && (
            <button
              onClick={() => quickSwitch('driver')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Switch to Driver Role
            </button>
          )}
        </div>

        {/* Operating instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">1. In-Store Picker</span>
            <p className="text-slate-500">Pick items according to customer substitution directives.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">2. Dispatch Tote</span>
            <p className="text-slate-500">Pack cold items in insulated bags and mark Out For Delivery.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">3. Doorstep Delivery</span>
            <p className="text-slate-500">Deliver within 1-hr slot window and mark Delivered.</p>
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="h-40 bg-white rounded-2xl animate-pulse border border-slate-200" />
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No active fulfillment orders queued</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-700">{o.orderNumber}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-semibold mt-1">
                    Slot: {o.deliverySlotDate} ({o.deliverySlotTime}) • Address: {o.deliveryAddress}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Items: {o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </div>

                <div>
                  {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' ? (
                    <button
                      disabled={updatingId === o.id || !isDriverOrAdmin}
                      onClick={() => handleAdvanceStatus(o.id, o.status)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      {updatingId === o.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {o.status === 'PLACED'
                          ? 'Start Picking'
                          : o.status === 'PICKING'
                          ? 'Dispatch Delivery'
                          : 'Mark Delivered'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{o.status}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function DriverPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading driver hub...</div>}>
      <DriverFulfillment />
    </Suspense>
  );
}
