'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, CreditCard, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, token, refreshCartCount } = useAuth();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('EDITORIAL15');
  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Checkout shipping fields
  const [shippingAddress, setShippingAddress] = useState({
    street: '12 Grosvenor Crescent',
    city: 'Edinburgh',
    state: 'Midlothian',
    postalCode: 'EH12 5EL',
    country: 'United Kingdom'
  });

  // Sandbox card simulation
  const [paymentOption, setPaymentOption] = useState<'success' | 'failure'>('success');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/cart', {}, token!);
      setCart(data);
      if (data.items && data.items.length > 0) {
        await recalculateQuote(data.items, couponCode);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recalculateQuote = async (items: any[], coupon?: string) => {
    setQuoteError(null);
    try {
      const formattedItems = items.map(it => ({
        editionId: it.editionId,
        quantity: it.quantity
      }));
      const quoteData = await apiRequest('/orders/quote', {
        method: 'POST',
        body: JSON.stringify({
          items: formattedItems,
          couponCode: coupon?.trim() || undefined
        })
      });
      setQuote(quoteData);
    } catch (err: any) {
      setQuoteError(err.message);
      // Fallback quote without coupon if coupon failed
      try {
        const formattedItems = items.map(it => ({
          editionId: it.editionId,
          quantity: it.quantity
        }));
        const fallback = await apiRequest('/orders/quote', {
          method: 'POST',
          body: JSON.stringify({ items: formattedItems })
        });
        setQuote(fallback);
      } catch {}
    }
  };

  const handleQuantityChange = async (editionId: string, newQty: number) => {
    try {
      const updated = await apiRequest(`/cart/items/${editionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty })
      }, token!);
      setCart(updated);
      await refreshCartCount();
      await recalculateQuote(updated.items, couponCode);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (editionId: string) => {
    try {
      const updated = await apiRequest(`/cart/items/${editionId}`, {
        method: 'DELETE'
      }, token!);
      setCart(updated);
      await refreshCartCount();
      if (updated.items.length > 0) {
        await recalculateQuote(updated.items, couponCode);
      } else {
        setQuote(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart?.items) {
      recalculateQuote(cart.items, couponCode);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setSubmittingOrder(true);

    try {
      const formattedItems = cart.items.map((it: any) => ({
        editionId: it.editionId,
        quantity: it.quantity
      }));

      const paymentMethod = paymentOption === 'success' ? 'sandbox_card' : 'simulate_failure';
      const cardNumber = paymentOption === 'success' ? '4000123456784000' : '4000123456784002';

      const checkoutRes = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: formattedItems,
          shippingAddress,
          couponCode: quote?.couponApplied ? quote.couponApplied.code : undefined,
          paymentMethod,
          cardNumber,
          idempotencyKey: `idem_${Date.now()}`
        })
      }, token!);

      await refreshCartCount();
      router.push(`/orders?confirmed=${checkoutRes.order.orderNumber}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-serif">
        <ShoppingBag className="w-12 h-12 text-parchment-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Please sign in to view your shopping bag</h2>
        <p className="text-sm text-gray-600 mt-2 font-sans">
          Your saved literary editions will synchronize across sessions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans text-gray-500">
        Reviewing your shopping bag...
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-serif">
      <h1 className="text-3xl font-bold font-serif text-parchment-900 mb-2">Shopping Bag</h1>
      <p className="text-xs font-sans text-gray-500 mb-8">
        Review and confirm your selected editions prior to checkout
      </p>

      {checkoutError && (
        <div className="mb-6 p-4 rounded bg-rose-50 border border-rose-300 text-rose-800 text-sm font-sans flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-parchment-300 p-12 text-center rounded">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-serif text-gray-700">Your shopping bag is currently empty.</p>
          <Link href="/" className="inline-block mt-4 text-xs font-sans uppercase tracking-widest text-editorial-burgundy font-bold hover:underline">
            Browse the Library Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item: any) => (
              <div
                key={item.editionId}
                className="border border-parchment-300 bg-white p-4 rounded-sm flex gap-4 items-center"
              >
                <div className="w-16 h-24 bg-parchment-100 flex-shrink-0 rounded overflow-hidden">
                  {item.coverImage && (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-base text-parchment-900 truncate">
                    {item.title}
                  </h3>
                  <div className="text-xs font-sans text-gray-500 space-x-2 mt-0.5">
                    <span className="font-semibold text-editorial-burgundy">{item.format}</span>
                    <span>&bull;</span>
                    <span className="font-mono">ISBN: {item.isbn}</span>
                  </div>
                  <div className="mt-2 text-sm font-serif font-bold text-gray-900">
                    ${item.unitPrice.toFixed(2)} each
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 font-sans text-xs">
                    <label className="text-gray-400">Qty:</label>
                    <select
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.editionId, Number(e.target.value))}
                      className="border border-parchment-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      {[...Array(Math.min(item.availableStock || 5, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <span className="font-serif font-bold text-base text-parchment-900">
                    ${item.lineTotal.toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleRemove(item.editionId)}
                    className="text-gray-400 hover:text-rose-600 transition p-1"
                    title="Remove edition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Coupon Code Input */}
            <div className="border border-parchment-300 bg-parchment-100 p-4 rounded-sm">
              <form onSubmit={handleApplyCoupon} className="flex gap-2 font-sans text-xs">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Promotional Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-parchment-300 rounded px-3 py-2 pl-9 uppercase tracking-wider focus:outline-none focus:border-editorial-burgundy"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-parchment-900 text-parchment-100 hover:bg-editorial-burgundy px-4 py-2 rounded font-bold uppercase tracking-wider transition"
                >
                  Apply
                </button>
              </form>
              {quoteError && (
                <p className="text-xs font-sans text-rose-700 mt-2">{quoteError}</p>
              )}
              {quote?.couponApplied && (
                <p className="text-xs font-sans text-emerald-700 mt-2">
                  Coupon <strong>{quote.couponApplied.code}</strong> applied ({quote.couponApplied.discountValue}% off).
                </p>
              )}
            </div>
          </div>

          {/* Checkout & Recalculated Order Summary Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-parchment-300 bg-white p-6 rounded-sm shadow-sm">
              <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mb-4">
                Server-Calculated Order Summary
              </h3>

              {quote ? (
                <div className="font-sans text-sm space-y-3 pb-4 border-b border-parchment-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal:</span>
                    <span className="font-serif font-bold text-gray-900">${quote.subtotal.toFixed(2)}</span>
                  </div>

                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({quote.couponApplied?.code}):</span>
                      <span>-${quote.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping &amp; Handling:</span>
                    <span>
                      {quote.shippingAmount === 0 ? (
                        <strong className="text-emerald-700 font-bold uppercase text-xs">Complimentary</strong>
                      ) : (
                        `$${quote.shippingAmount.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Sales Tax (8.25%):</span>
                    <span>${quote.taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-parchment-200 flex justify-between items-baseline">
                    <span className="font-serif font-bold text-lg text-parchment-900">Total Due:</span>
                    <span className="font-serif font-bold text-2xl text-editorial-burgundy">
                      ${quote.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="mt-6 space-y-4 font-sans text-xs">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider">
                  Shipping Particulars
                </h4>

                <div>
                  <label className="block text-gray-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full border border-parchment-300 rounded px-2.5 py-1.5 bg-parchment-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full border border-parchment-300 rounded px-2.5 py-1.5 bg-parchment-50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full border border-parchment-300 rounded px-2.5 py-1.5 bg-parchment-50"
                    />
                  </div>
                </div>

                {/* Deterministic Sandbox Payment Method */}
                <div className="pt-2">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Deterministic Sandbox Payment</span>
                  </h4>

                  <div className="space-y-2">
                    <label className={`block border p-2.5 rounded cursor-pointer transition ${
                      paymentOption === 'success' 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : 'border-parchment-200 bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sandboxPayment"
                          checked={paymentOption === 'success'}
                          onChange={() => setPaymentOption('success')}
                        />
                        <span className="font-bold text-emerald-900">Test Card (Success Simulation)</span>
                      </div>
                      <p className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        Card ending in 4000 &bull; Confirms payment and decrements audited stock.
                      </p>
                    </label>

                    <label className={`block border p-2.5 rounded cursor-pointer transition ${
                      paymentOption === 'failure' 
                        ? 'border-rose-600 bg-rose-50/50' 
                        : 'border-parchment-200 bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sandboxPayment"
                          checked={paymentOption === 'failure'}
                          onChange={() => setPaymentOption('failure')}
                        />
                        <span className="font-bold text-rose-900">Test Card (Decline Simulation)</span>
                      </div>
                      <p className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        Card ending in 4002 &bull; Simulates decline; leaves stock completely unchanged.
                      </p>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || !quote}
                  className="w-full mt-4 bg-editorial-burgundy text-white hover:bg-red-900 py-3 rounded text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow transition disabled:bg-gray-300"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submittingOrder ? 'Processing Payment...' : 'Confirm & Place Order'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
