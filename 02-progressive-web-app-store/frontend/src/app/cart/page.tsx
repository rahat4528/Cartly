'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trash2, ShoppingBag, ShieldCheck, WifiOff, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, token, isOnline, refreshCart, pendingCount, syncPendingActions } = useAuth();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState({
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    postalCode: '97477'
  });

  useEffect(() => {
    if (token && isOnline) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [token, isOnline]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/cart', {}, token!);
      setCart(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId: string, quantity: number) => {
    if (!isOnline) {
      alert('Updating cart quantities while completely disconnected can be queued from the product page.');
      return;
    }
    try {
      const updated = await apiRequest(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      }, token!);
      setCart(updated);
      await refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const updated = await apiRequest(`/cart/items/${productId}`, {
        method: 'DELETE'
      }, token!);
      setCart(updated);
      await refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setCheckoutError('Offline checkout is disabled. Please connect to a network to authorize payment and confirm stock.');
      return;
    }

    setSubmittingOrder(true);
    setCheckoutError(null);

    try {
      const items = cart.items.map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity
      }));

      const order = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items,
          shippingAddress,
          idempotencyKey: `pwa_idem_${Date.now()}`
        })
      }, token!);

      await refreshCart();
      router.push(`/orders?confirmed=${order.orderNumber}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (!isOnline && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="p-6 text-center space-y-4 pt-16">
        <WifiOff className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Offline Mode Active</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          You have <strong>{pendingCount} actions</strong> queued in local device storage. Connect to a network or hit sync to validate actions against live store inventory.
        </p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 9.99;
  const total = Number((subtotal + tax + shipping).toFixed(2));

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white">Your Shopping Bag</h1>
        <p className="text-xs text-slate-400">Review selected hardware before online checkout</p>
      </div>

      {!isOnline && (
        <div className="bg-amber-950/80 border border-amber-500/40 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Offline mode: Online payment is locked until connection is restored.</span>
        </div>
      )}

      {checkoutError && (
        <div className="bg-rose-950/80 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200">
          {checkoutError}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-6 space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Your shopping bag is empty</p>
          <Link
            href="/"
            className="inline-block bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-400 transition"
          >
            Explore Hardware
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-2.5">
            {items.map((item: any) => (
              <div
                key={item.productId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex gap-3 items-center"
              >
                <div className="w-14 h-14 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-white truncate">{item.title}</h3>
                  <p className="text-xs text-cyan-400 font-semibold mt-0.5">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => handleUpdateQty(item.productId, Number(e.target.value))}
                    disabled={!isOnline}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                  >
                    {[...Array(Math.min(item.stock || 5, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sales Tax (8.25%):</span>
              <span className="font-semibold text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping:</span>
              <span className="font-semibold text-white">
                {shipping === 0 ? <span className="text-emerald-400">Free over $100</span> : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between text-sm font-bold text-white">
              <span>Total:</span>
              <span className="text-cyan-400 text-base">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Online Checkout Form */}
          <form onSubmit={handleCheckout} className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Shipping Destination
            </h3>
            <input
              type="text"
              required
              placeholder="Street address"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="Postal code"
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!isOnline || submittingOrder}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                !isOnline
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submittingOrder ? 'Processing...' : !isOnline ? 'Connect to Checkout' : 'Complete Online Checkout'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
