'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Product, DeliverySlot, Order, fetchApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Truck,
  Leaf,
  ShieldAlert
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' | 'CONTACT_ME' | 'DO_NOT_SUBSTITUTE';
}

function GroceryStorefront() {
  const router = useRouter();
  const { user, token, quickSwitch } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '742 Evergreen Terrace, Apt 4B');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+1 (555) 789-0123');
  const [deliveryNotes, setDeliveryNotes] = useState('Please leave on front porch');
  const [driverTip, setDriverTip] = useState(3.00);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const categories = ['All', 'Produce', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Beverages'];

  // Load products
  useEffect(() => {
    let url = '/products';
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    fetchApi<{ products: Product[] }>(url)
      .then((data) => setProducts(data.products))
      .catch((err) => console.error(err));
  }, [selectedCategory, searchQuery]);

  // Load delivery slots
  useEffect(() => {
    fetchApi<{ slots: DeliverySlot[] }>('/delivery-slots')
      .then((data) => {
        setDeliverySlots(data.slots);
        const available = data.slots.find((s) => !s.isSoldOut);
        if (available && !selectedSlotId) {
          setSelectedSlotId(available.id);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedSlotId]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, substitutionPolicy: 'SUBSTITUTE_BEST_MATCH' }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateSubstitution = (
    productId: string,
    policy: 'SUBSTITUTE_BEST_MATCH' | 'CONTACT_ME' | 'DO_NOT_SUBSTITUTE'
  ) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, substitutionPolicy: policy } : item
      )
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = 4.99;
  const estimatedTax = Math.round(cartSubtotal * 0.0825 * 100) / 100;
  const grandTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee + estimatedTax + driverTip : 0;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Checkout execution
  const handleCheckout = async (cardToken: string = 'tok_visa_success') => {
    if (!user) {
      alert('Please sign in as a customer.');
      await quickSwitch('customer');
      return;
    }
    if (!selectedSlotId) {
      setErrorMsg('Please select an available delivery slot.');
      return;
    }

    setIsCheckingOut(true);
    setErrorMsg(null);

    try {
      const res = await fetchApi<{ order: Order }>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            deliverySlotId: selectedSlotId,
            deliveryAddress,
            contactPhone,
            deliveryNotes,
            driverTip,
            cardToken,
            items: cart.map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
              substitutionPolicy: i.substitutionPolicy,
            })),
          }),
        },
        token
      );

      setOrderSuccess(res.order);
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <Navbar cartCount={totalItemsCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-900 text-white p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" />
              <span>Locally Sourced Organic Market</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Fresh Groceries Delivered in 1-Hour Guaranteed Windows.
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base">
              Smart substitution preferences, temperature-controlled transit, and strict delivery slot capacity guarantees.
            </p>
          </div>
        </div>

        {/* Success Modal */}
        {orderSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <h3 className="text-xl font-extrabold">Grocery Delivery Scheduled!</h3>
                <p className="text-xs text-emerald-700">
                  Order Number: <span className="font-mono font-bold">{orderSuccess.orderNumber}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-2xl border border-emerald-100">
              <div>
                <span className="text-slate-500 block">Delivery Window</span>
                <span className="font-bold text-slate-800">{orderSuccess.deliverySlotTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className="font-bold text-emerald-600 uppercase">{orderSuccess.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Items Count</span>
                <span className="font-bold text-slate-800">{orderSuccess.items.length} items</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Charged</span>
                <span className="font-bold text-slate-900">${orderSuccess.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/orders')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
              >
                Track Fulfillment Pipeline
              </button>
              <button
                onClick={() => setOrderSuccess(null)}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search produce, bakery, dairy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.isOrganic && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                      <Leaf className="w-3 h-3" />
                      <span>Organic</span>
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/70 backdrop-blur text-white text-[10px] font-semibold">
                    {p.aisle}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                    {p.category}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <div>
                  <span className="text-lg font-extrabold text-slate-900">${p.price.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">/{p.unitType.toLowerCase()}</span>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Slide-out Cart & Delivery Slot Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-slate-900">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-extrabold">Fresh Delivery Cart ({totalItemsCount})</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">Your grocery cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{item.product.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            ${item.product.price.toFixed(2)} each
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 text-slate-600 hover:text-emerald-600"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 text-slate-600 hover:text-emerald-600"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Substitution Selector */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 block">
                          If Out of Stock:
                        </label>
                        <select
                          value={item.substitutionPolicy}
                          onChange={(e) =>
                            updateSubstitution(item.product.id, e.target.value as any)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
                        >
                          <option value="SUBSTITUTE_BEST_MATCH">
                            Best Match (Picker selects equivalent item)
                          </option>
                          <option value="CONTACT_ME">Contact Me (Call/SMS before replacing)</option>
                          <option value="DO_NOT_SUBSTITUTE">Do Not Substitute (Refund item)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Slot Selection & Summary */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-5">
                {/* Delivery Slot Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-700 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Select 1-Hour Delivery Window</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold">Today</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {deliverySlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          disabled={slot.isSoldOut}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                            slot.isSoldOut
                              ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <div className="font-bold">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isSelected
                                ? 'text-emerald-100'
                                : slot.isSoldOut
                                ? 'text-red-500 font-bold'
                                : slot.remainingCapacity <= 2
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {slot.isSoldOut ? 'SOLD OUT' : `${slot.remainingCapacity} spots left`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-700">Delivery Address</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                    placeholder="Street, Apt, Unit"
                  />
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-bold">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee (1-hr window)</span>
                    <span className="font-mono font-bold">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sales Tax (8.25%)</span>
                    <span className="font-mono font-bold">${estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Courier Tip</span>
                    <div className="flex items-center space-x-1 font-mono font-bold">
                      <button
                        onClick={() => setDriverTip(2.00)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${driverTip === 2.00 ? 'bg-emerald-600 text-white' : 'bg-white border'}`}
                      >
                        $2
                      </button>
                      <button
                        onClick={() => setDriverTip(3.00)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${driverTip === 3.00 ? 'bg-emerald-600 text-white' : 'bg-white border'}`}
                      >
                        $3
                      </button>
                      <button
                        onClick={() => setDriverTip(5.00)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${driverTip === 5.00 ? 'bg-emerald-600 text-white' : 'bg-white border'}`}
                      >
                        $5
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Total Amount</span>
                    <span className="font-mono text-emerald-700 text-base">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <div className="space-y-2">
                  <button
                    disabled={isCheckingOut}
                    onClick={() => handleCheckout('tok_visa_success')}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition-colors shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isCheckingOut ? 'Securing Slot & Paying...' : `Place Delivery Order • $${grandTotal.toFixed(2)}`}
                    </span>
                  </button>
                  <button
                    disabled={isCheckingOut}
                    onClick={() => handleCheckout('tok_declined')}
                    className="w-full py-1.5 text-center text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Simulate Payment Decline (Sandbox)
                  </button>
                </div>
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
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading CartlyFresh...</div>}>
      <GroceryStorefront />
    </Suspense>
  );
}
