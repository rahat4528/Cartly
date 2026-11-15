'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  PlusCircle, 
  Tag, 
  BookOpen, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  History,
  Archive
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'coupons' | 'reviews' | 'customers'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Stock Adjustment Form
  const [adjustEditionId, setAdjustEditionId] = useState('');
  const [adjustDelta, setAdjustDelta] = useState(10);
  const [adjustReason, setAdjustReason] = useState('RESTOCK');
  const [adjustNotes, setAdjustNotes] = useState('');

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(25);
  const [newCouponMax, setNewCouponMax] = useState(200);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      loadAllAdminData();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [anData, alertData, movData, ordData, cpnData, revData, custData] = await Promise.all([
        apiRequest('/admin/analytics', {}, token!),
        apiRequest('/admin/inventory/alerts', {}, token!),
        apiRequest('/admin/inventory/movements', {}, token!),
        apiRequest('/admin/orders', {}, token!),
        apiRequest('/admin/coupons', {}, token!),
        apiRequest('/admin/reviews', {}, token!),
        apiRequest('/admin/customers', {}, token!)
      ]);

      setAnalytics(anData);
      setLowStockAlerts(alertData);
      setMovements(movData);
      setOrders(ordData);
      setCoupons(cpnData);
      setReviews(revData);
      setCustomers(custData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          editionId: adjustEditionId,
          quantityDelta: Number(adjustDelta),
          reason: adjustReason,
          notes: adjustNotes
        })
      }, token!);
      setActionMsg('Inventory adjustment recorded and audit ledger updated.');
      setTimeout(() => setActionMsg(null), 3000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderNumber: string, nextStatus: string) => {
    try {
      await apiRequest(`/admin/orders/${orderNumber}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          note: `Fulfillment status transitioned by admin ${user?.firstName}`
        })
      }, token!);
      setActionMsg(`Order ${orderNumber} updated to ${nextStatus}.`);
      setTimeout(() => setActionMsg(null), 3000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCouponCode,
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          minOrderAmount: Number(newCouponMin),
          maxUses: Number(newCouponMax),
          expiresAt: '2028-12-31T23:59:59Z'
        })
      }, token!);
      setActionMsg(`Promotional coupon ${newCouponCode} created.`);
      setNewCouponCode('');
      setTimeout(() => setActionMsg(null), 3000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleCoupon = async (couponId: string) => {
    try {
      await apiRequest(`/admin/coupons/${couponId}/toggle`, { method: 'PATCH' }, token!);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleModerateReview = async (reviewId: string, isApproved: boolean) => {
    try {
      await apiRequest(`/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved })
      }, token!);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!token || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-serif">
        <ShieldCheck className="w-12 h-12 text-rose-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Administrator Access Required</h2>
        <p className="text-sm font-sans text-gray-600 mt-2">
          Please authenticate with an administrative account or use the top banner button to switch roles.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-serif">
      {/* Admin Title & Feedback */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-parchment-300 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-editorial-burgundy" />
            <h1 className="text-3xl font-bold text-parchment-900">Bookstore Admin Suite</h1>
          </div>
          <p className="text-xs font-sans text-gray-500 mt-1">
            Storewide operations: Inventory audits, fulfillment lifecycles, marketing coupons, and sales analytics
          </p>
        </div>

        {actionMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-sans px-4 py-2 rounded">
            {actionMsg}
          </div>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex space-x-6 border-b border-parchment-200 mt-6 font-sans text-xs uppercase tracking-wider font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 transition ${activeTab === 'analytics' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Analytics &amp; Revenue
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'inventory' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <span>Inventory &amp; Audit Log</span>
          {lowStockAlerts.length > 0 && (
            <span className="bg-editorial-amber text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {lowStockAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition ${activeTab === 'orders' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Order Fulfillment ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 border-b-2 transition ${activeTab === 'coupons' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Coupons &amp; Discounts
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 border-b-2 transition ${activeTab === 'reviews' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Review Moderation
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 border-b-2 transition ${activeTab === 'customers' ? 'border-editorial-burgundy text-editorial-burgundy' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Customer Directory
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-sans text-gray-500">Loading administrative telemetry...</div>
      ) : (
        <div className="mt-8">
          {/* TAB 1: ANALYTICS & OVERVIEW */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-parchment-300 bg-white p-5 rounded-sm shadow-sm">
                  <div className="flex justify-between items-center text-gray-500 mb-2">
                    <span className="text-xs uppercase tracking-wider font-bold">Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-gray-900">
                    ${analytics.grossRevenue.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Confirmed paid checkouts</p>
                </div>

                <div className="border border-parchment-300 bg-white p-5 rounded-sm shadow-sm">
                  <div className="flex justify-between items-center text-gray-500 mb-2">
                    <span className="text-xs uppercase tracking-wider font-bold">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-gray-900">
                    {analytics.totalOrders}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{analytics.paidOrdersCount} successfully fulfilled</p>
                </div>

                <div className="border border-parchment-300 bg-white p-5 rounded-sm shadow-sm">
                  <div className="flex justify-between items-center text-gray-500 mb-2">
                    <span className="text-xs uppercase tracking-wider font-bold">Low-Stock Warnings</span>
                    <AlertTriangle className="w-4 h-4 text-editorial-amber" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-gray-900">
                    {analytics.lowStockCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Editions with &le; 10 copies</p>
                </div>

                <div className="border border-parchment-300 bg-white p-5 rounded-sm shadow-sm">
                  <div className="flex justify-between items-center text-gray-500 mb-2">
                    <span className="text-xs uppercase tracking-wider font-bold">Registered Readers</span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-gray-900">
                    {analytics.customerCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Active customer accounts</p>
                </div>
              </div>

              {/* Category Sales Breakdown */}
              <div className="border border-parchment-300 bg-white p-6 rounded-sm">
                <h3 className="font-serif font-bold text-lg text-parchment-900 mb-4">
                  Literary Category Performance
                </h3>
                <div className="space-y-4">
                  {analytics.categorySales.map((cat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-parchment-100 pb-2">
                      <span className="font-bold text-gray-800">{cat.name}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-gray-500">{cat.unitsSold} copies sold</span>
                        <span className="font-serif font-bold text-gray-900 w-24 text-right">
                          ${cat.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & AUDIT MOVEMENTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-10 font-sans">
              {/* Low Stock Alerts */}
              <div>
                <h3 className="font-serif font-bold text-xl text-parchment-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-editorial-amber" />
                  <span>Real-Time Low Stock Alerts</span>
                </h3>

                <div className="border border-parchment-300 bg-white rounded-sm overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-parchment-100 uppercase text-gray-500 font-bold border-b border-parchment-200">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">Format</th>
                        <th className="p-3">ISBN</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Remaining Stock</th>
                        <th className="p-3">Urgency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-parchment-100">
                      {lowStockAlerts.map((alert: any) => (
                        <tr key={alert.editionId} className="hover:bg-parchment-50">
                          <td className="p-3 font-serif font-bold text-gray-900">{alert.title}</td>
                          <td className="p-3 font-semibold text-editorial-burgundy">{alert.format}</td>
                          <td className="p-3 font-mono text-gray-600">{alert.isbn}</td>
                          <td className="p-3 font-mono text-gray-600">{alert.sku}</td>
                          <td className="p-3 font-bold text-gray-900">{alert.currentStock} copies</td>
                          <td className="p-3">
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {alert.urgency}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjust Stock Form */}
              <div className="border border-parchment-300 bg-parchment-50 p-6 rounded-sm">
                <h4 className="font-serif font-bold text-base text-parchment-900 mb-2">
                  Adjust Inventory Stock (With Audit Trail)
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  Every adjustment is permanently logged in the immutable `InventoryMovement` ledger.
                </p>

                <form onSubmit={handleAdjustStock} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1">Target Edition</label>
                    <select
                      value={adjustEditionId}
                      onChange={(e) => setAdjustEditionId(e.target.value)}
                      required
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    >
                      <option value="">Choose Edition...</option>
                      {lowStockAlerts.map(a => (
                        <option key={a.editionId} value={a.editionId}>
                          {a.title} ({a.format}) - Stock: {a.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Quantity Delta (+/-)</label>
                    <input
                      type="number"
                      required
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(Number(e.target.value))}
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Mandatory Movement Reason</label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    >
                      <option value="RESTOCK">RESTOCK (Warehouse Intake)</option>
                      <option value="DAMAGE_WRITE_OFF">DAMAGE_WRITE_OFF</option>
                      <option value="RETURN">RETURN (Customer Return)</option>
                      <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!adjustEditionId}
                      className="w-full bg-editorial-burgundy text-white hover:bg-red-900 py-2.5 rounded font-bold uppercase tracking-wider transition disabled:bg-gray-300"
                    >
                      Record Adjustment
                    </button>
                  </div>
                </form>
              </div>

              {/* Movement Ledger History */}
              <div>
                <h4 className="font-serif font-bold text-lg text-parchment-900 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <span>Immutable Inventory Movement Audit Ledger</span>
                </h4>

                <div className="border border-parchment-300 bg-white rounded-sm overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-parchment-100 uppercase text-gray-500 font-bold border-b border-parchment-200 sticky top-0">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Book Title</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Delta</th>
                        <th className="p-3">Prev &rarr; New Stock</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-parchment-100">
                      {movements.map((mov: any) => (
                        <tr key={mov.id} className="hover:bg-parchment-50">
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            {new Date(mov.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-serif font-bold text-gray-900">{mov.bookTitle} ({mov.format})</td>
                          <td className="p-3">
                            <span className="font-mono uppercase font-bold text-[10px] bg-parchment-100 px-1.5 py-0.5 rounded border border-parchment-200">
                              {mov.reason}
                            </span>
                          </td>
                          <td className={`p-3 font-bold ${mov.changeAmount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {mov.changeAmount > 0 ? `+${mov.changeAmount}` : mov.changeAmount}
                          </td>
                          <td className="p-3 font-mono">{mov.previousStock} &rarr; {mov.newStock}</td>
                          <td className="p-3 text-gray-500 text-[11px]">{mov.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER FULFILLMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6 font-sans">
              <h3 className="font-serif font-bold text-xl text-parchment-900 mb-2">
                Order Lifecycle Operations
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Advance orders through the domain state machine: PENDING_PAYMENT &rarr; PAID &rarr; PROCESSING &rarr; SHIPPED &rarr; DELIVERED
              </p>

              <div className="border border-parchment-300 bg-white rounded-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-parchment-100 uppercase text-gray-500 font-bold border-b border-parchment-200">
                    <tr>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Advance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {orders.map((ord: any) => (
                      <tr key={ord.orderNumber} className="hover:bg-parchment-50">
                        <td className="p-3 font-mono font-bold text-editorial-burgundy">{ord.orderNumber}</td>
                        <td className="p-3">{ord.shippingAddress?.street}, {ord.shippingAddress?.city}</td>
                        <td className="p-3 text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">{ord.items?.length || 0} line items</td>
                        <td className="p-3 font-serif font-bold text-gray-900">${ord.totalAmount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-parchment-100 border border-parchment-300">
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5">
                            {ord.status === 'PAID' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderNumber, 'PROCESSING')}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] hover:bg-blue-700"
                              >
                                Pick &amp; Pack
                              </button>
                            )}
                            {ord.status === 'PROCESSING' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderNumber, 'SHIPPED')}
                                className="bg-purple-600 text-white px-2 py-1 rounded text-[10px] hover:bg-purple-700"
                              >
                                Dispatch (Ship)
                              </button>
                            )}
                            {ord.status === 'SHIPPED' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderNumber, 'DELIVERED')}
                                className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] hover:bg-emerald-700"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {['PAID', 'PROCESSING'].includes(ord.status) && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderNumber, 'REFUNDED')}
                                className="bg-rose-600 text-white px-2 py-1 rounded text-[10px] hover:bg-rose-700"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COUPONS & DISCOUNTS */}
          {activeTab === 'coupons' && (
            <div className="space-y-8 font-sans">
              {/* Create Coupon Form */}
              <div className="border border-parchment-300 bg-parchment-50 p-6 rounded-sm">
                <h4 className="font-serif font-bold text-base text-parchment-900 mb-2">
                  Create Promotional Coupon
                </h4>
                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AUTUMN20"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full border border-parchment-300 rounded p-2 uppercase bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Discount Type</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as any)}
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    >
                      <option value="PERCENT">PERCENT (%)</option>
                      <option value="FIXED">FIXED ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(Number(e.target.value))}
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Min Order ($)</label>
                    <input
                      type="number"
                      required
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(Number(e.target.value))}
                      className="w-full border border-parchment-300 rounded p-2 bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-editorial-burgundy text-white hover:bg-red-900 py-2.5 rounded font-bold uppercase tracking-wider transition"
                    >
                      Publish Coupon
                    </button>
                  </div>
                </form>
              </div>

              {/* Coupons List */}
              <div className="border border-parchment-300 bg-white rounded-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-parchment-100 uppercase text-gray-500 font-bold border-b border-parchment-200">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Usage</th>
                      <th className="p-3">Expires</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {coupons.map((c: any) => (
                      <tr key={c.id} className="hover:bg-parchment-50">
                        <td className="p-3 font-mono font-bold text-editorial-burgundy">{c.code}</td>
                        <td className="p-3">{c.discountType}</td>
                        <td className="p-3 font-bold">{c.discountType === 'PERCENT' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                        <td className="p-3">${c.minOrderAmount.toFixed(2)}</td>
                        <td className="p-3">{c.usedCount} / {c.maxUses}</td>
                        <td className="p-3 text-gray-500">{new Date(c.expiresAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleCoupon(c.id)}
                            className="text-editorial-burgundy hover:underline text-[11px] font-semibold"
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: REVIEW MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 font-sans text-xs">
              <h3 className="font-serif font-bold text-xl text-parchment-900 mb-2">
                Reader Review Moderation
              </h3>
              <p className="text-gray-500 mb-6">
                Approve or flag community feedback submitted by verified purchasers
              </p>

              {reviews.map((rev: any) => (
                <div key={rev.id} className="border border-parchment-300 bg-white p-4 rounded flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{rev.title}</span>
                      <span className="text-amber-500">({rev.rating}/5 stars)</span>
                      <span className="text-gray-400">&bull; on {rev.bookTitle}</span>
                    </div>
                    <p className="text-gray-600 mt-1 font-serif text-sm">{rev.comment}</p>
                    <p className="text-[10px] text-gray-400 mt-2">By {rev.userEmail} on {new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.isApproved ? (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded">Approved</span>
                    ) : (
                      <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-1 rounded">Rejected</span>
                    )}

                    <button
                      onClick={() => handleModerateReview(rev.id, !rev.isApproved)}
                      className="border border-parchment-300 px-2.5 py-1 rounded hover:bg-parchment-100 text-[10px]"
                    >
                      {rev.isApproved ? 'Reject' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: CUSTOMER DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-4 font-sans text-xs">
              <h3 className="font-serif font-bold text-xl text-parchment-900 mb-2">
                Registered Reader Directory
              </h3>

              <div className="border border-parchment-300 bg-white rounded-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-parchment-100 uppercase text-gray-500 font-bold border-b border-parchment-200">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Orders</th>
                      <th className="p-3">Lifetime Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {customers.map((cust: any) => (
                      <tr key={cust.id} className="hover:bg-parchment-50">
                        <td className="p-3 font-serif font-bold text-gray-900">{cust.firstName} {cust.lastName}</td>
                        <td className="p-3 font-mono text-gray-600">{cust.email}</td>
                        <td className="p-3">{cust.profile?.city}, {cust.profile?.country}</td>
                        <td className="p-3 font-bold">{cust.orderCount} orders</td>
                        <td className="p-3 font-serif font-bold text-editorial-burgundy">${cust.totalSpent.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
