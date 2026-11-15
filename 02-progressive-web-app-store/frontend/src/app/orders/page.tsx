'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Package, CheckCircle2, Clock, Truck } from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get('confirmed');
  const { user, token, isOnline } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && isOnline) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [token, isOnline]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/orders', {}, token!);
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white">Your Device Orders</h1>
        <p className="text-xs text-slate-400">Real-time status updates and delivery tracking</p>
      </div>

      {confirmed && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-bold">Order Confirmed: {confirmed}</p>
            <p className="text-[11px] text-emerald-300">Your hardware reservation has been secured and inventory updated.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading order dispatches...</div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-6 space-y-3">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-medium">No previous orders on record</p>
          <Link
            href="/"
            className="inline-block bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-400 transition"
          >
            Browse Devices
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.orderNumber}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs"
            >
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
                <div>
                  <span className="font-mono font-bold text-cyan-400">{ord.orderNumber}</span>
                  <span className="text-slate-400 text-[10px] block">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {ord.status}
                </span>
              </div>

              <div className="space-y-1.5">
                {ord.items?.map((it: any) => (
                  <div key={it.productId} className="flex justify-between text-slate-300">
                    <span>{it.quantity} x {it.title}</span>
                    <span className="font-semibold">${Number(it.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex justify-between font-bold text-white">
                <span>Total Paid:</span>
                <span className="text-cyan-400">${Number(ord.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-slate-400">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
