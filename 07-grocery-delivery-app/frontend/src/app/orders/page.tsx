'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Order, fetchApi } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';

function OrdersTracker() {
  const { user, token, quickSwitch } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchApi<{ orders: Order[] }>('/orders/my-orders', {}, token)
      .then((data) => setOrders(data.orders))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Payment will be refunded and delivery slot released.')) {
      return;
    }
    setCancellingId(orderId);
    try {
      await fetchApi(`/orders/${orderId}/cancel`, { method: 'POST' }, token);
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <ClipboardList className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-900">Sign In to Track Deliveries</h2>
          <p className="text-xs text-slate-500">
            View real-time supermarket picking and driver transit for your grocery orders.
          </p>
          <button
            onClick={() => quickSwitch('customer')}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Sign in as Demo Customer
          </button>
        </div>
      </>
    );
  }

  const steps = [
    { key: 'PLACED', label: 'Order Scheduled', icon: Clock },
    { key: 'PICKING', label: 'In-Store Picking', icon: ShoppingBag },
    { key: 'OUT_FOR_DELIVERY', label: 'On Route', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Your Grocery Deliveries</h1>
            <p className="text-xs text-slate-500 mt-1">
              Live fulfillment status from supermarket shelf to your doorstep.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Shop More Items
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Orders Yet</h3>
            <p className="text-xs text-slate-400">Your scheduled grocery delivery orders will show up here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((o) => {
              const isCancelled = o.status === 'CANCELLED';
              const isDelivered = o.status === 'DELIVERED';
              const currentStepIndex = steps.findIndex((s) => s.key === o.status);

              return (
                <div
                  key={o.id}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8 space-y-6"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-emerald-600 font-bold">
                        {o.orderNumber}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        Delivery Window: {o.deliverySlotDate} ({o.deliverySlotTime})
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          isCancelled
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : isDelivered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.status.replace('_', ' ')}
                      </span>

                      {o.status === 'PLACED' && (
                        <button
                          disabled={cancellingId === o.id}
                          onClick={() => handleCancelOrder(o.id)}
                          className="px-3 py-1 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                        >
                          {cancellingId === o.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Stepper */}
                  {!isCancelled && (
                    <div className="grid grid-cols-4 gap-2 pt-2 pb-4">
                      {steps.map((st, idx) => {
                        const Icon = st.icon;
                        const isDone = currentStepIndex >= idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                          <div key={st.key} className="text-center space-y-1.5">
                            <div
                              className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div
                              className={`text-[11px] font-bold ${
                                isDone ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Items Breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Ordered Produce & Items ({o.items.length})
                    </span>
                    <div className="divide-y divide-slate-200/60">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">
                              {item.quantity}x {item.productName}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Substitution: <span className="font-semibold text-emerald-700">{item.substitutionPolicy}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Total Paid (incl. delivery & tax)</span>
                      <span className="font-mono text-emerald-700 text-sm">
                        ${o.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading orders...</div>}>
      <OrdersTracker />
    </Suspense>
  );
}
