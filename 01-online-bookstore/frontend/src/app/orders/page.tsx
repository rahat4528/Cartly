'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Package, CheckCircle2, Clock, Truck, FileText, ArrowLeft, Printer } from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const confirmedOrderNumber = searchParams.get('confirmed');
  const { user, token } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/orders', {}, token!);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (orderNumber: string) => {
    setLoadingInvoice(true);
    try {
      const res = await apiRequest(`/orders/${orderNumber}/invoice`, {}, token!);
      setSelectedInvoice(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-xs font-sans font-bold">PAID</span>;
      case 'PROCESSING':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-xs font-sans font-bold">PROCESSING</span>;
      case 'SHIPPED':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-xs font-sans font-bold">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="bg-gray-100 text-gray-800 border border-gray-300 px-2 py-0.5 rounded text-xs font-sans font-bold">DELIVERED</span>;
      case 'CANCELLED':
      case 'REFUNDED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-xs font-sans font-bold">{status}</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-xs font-sans font-bold">{status}</span>;
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-serif">
        <Package className="w-12 h-12 text-parchment-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Please sign in to track your book orders</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-serif">
      <h1 className="text-3xl font-bold text-parchment-900 mb-2">Order History &amp; Tracking</h1>
      <p className="text-xs font-sans text-gray-500 mb-8">
        Review past literary dispatches, carrier tracking timelines, and printable invoices
      </p>

      {confirmedOrderNumber && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-sm font-sans flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Order {confirmedOrderNumber} Confirmed!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your payment was authorized and inventory decremented. Our fulfillment curators will inspect your edition shortly.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center font-sans text-gray-500">Retrieving order logs...</div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-parchment-300 p-12 text-center rounded">
          <p className="text-lg font-serif text-gray-700">No orders on record.</p>
          <Link href="/" className="inline-block mt-4 text-xs font-sans uppercase tracking-widest text-editorial-burgundy font-bold hover:underline">
            Explore Books in Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="border border-parchment-300 bg-white rounded-sm shadow-sm overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="bg-parchment-100 px-6 py-4 border-b border-parchment-200 flex flex-wrap items-center justify-between gap-4 font-sans text-xs">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Order Number</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Date Placed</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Total Amount</span>
                    <span className="font-serif font-bold text-gray-900 text-sm">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <button
                    onClick={() => handleViewInvoice(order.orderNumber)}
                    className="flex items-center gap-1 text-editorial-burgundy hover:underline font-semibold bg-white px-2.5 py-1 rounded border border-parchment-300"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Invoice</span>
                  </button>
                </div>
              </div>

              {/* Order Items & Tracking Timeline */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Items column */}
                <div className="md:col-span-7 space-y-4">
                  <h4 className="text-xs uppercase font-sans font-bold text-gray-500 tracking-wider">
                    Dispatched Particulars
                  </h4>
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-parchment-100 pb-3">
                      <div>
                        <h5 className="font-serif font-bold text-parchment-900">{item.title}</h5>
                        <p className="text-xs font-sans text-gray-500">
                          {item.format} &bull; ISBN: <span className="font-mono">{item.isbn}</span> &bull; Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-serif font-bold text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="font-sans text-xs text-gray-600 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount ({order.couponCode || 'PROMO'}):</span>
                        <span>-${order.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${order.shippingAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${order.taxAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline status column */}
                <div className="md:col-span-5 bg-parchment-50 p-4 rounded border border-parchment-200">
                  <h4 className="text-xs uppercase font-sans font-bold text-gray-500 tracking-wider mb-3">
                    Fulfillment Lifecycle Timeline
                  </h4>

                  <div className="space-y-4 font-sans text-xs">
                    {order.timeline?.map((event: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-editorial-burgundy mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                            {event.status}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                          {event.note && (
                            <p className="text-xs text-gray-600 mt-0.5">{event.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-parchment-200 text-[11px] font-sans text-gray-500">
                    <p className="font-semibold text-gray-700">Shipping Destination:</p>
                    <p>{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                    <p>{order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl p-6 font-mono text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="font-bold text-gray-800 text-sm font-sans">
                Official Generated Invoice: {selectedInvoice.data.orderNumber}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-parchment-100 hover:bg-parchment-200 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 font-sans text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded font-sans text-xs"
                >
                  Close
                </button>
              </div>
            </div>

            <pre className="mt-4 p-4 bg-gray-50 rounded text-gray-800 whitespace-pre-wrap leading-relaxed overflow-x-auto border border-gray-200">
              {selectedInvoice.formattedText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans text-gray-400">Loading order timeline...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
