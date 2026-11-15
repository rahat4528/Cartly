'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, CreditCard, Wrench, CheckCircle2, Clock, 
  AlertCircle, FileText, Download, ShieldCheck, Plus, Receipt 
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function TenantPortalPage() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance Modal
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'GENERAL'>('PLUMBING');
  const [ticketUrgency, setTicketUrgency] = useState<'EMERGENCY' | 'HIGH' | 'STANDARD'>('STANDARD');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Pay Rent Modal
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('SANDBOX_ACH');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);

  useEffect(() => {
    fetchTenantData();
  }, [user]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [leasesData, ledgerData, ticketsData] = await Promise.all([
        apiRequest('/leases').catch(() => []),
        apiRequest('/payments/ledger').catch(() => []),
        apiRequest('/maintenance').catch(() => [])
      ]);
      setLeases(leasesData);
      setPayments(ledgerData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('Error fetching tenant dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignLease = async (leaseId: string) => {
    try {
      await apiRequest(`/leases/${leaseId}/sign`, { method: 'POST' });
      fetchTenantData();
    } catch (err: any) {
      alert(err.message || 'Error signing lease');
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setProcessingPayment(true);
    try {
      const updated = await apiRequest('/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          paymentMethod
        })
      });
      setSelectedPayment(null);
      setReceiptModal(updated);
      fetchTenantData();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leases.length === 0) {
      alert('You must have an active lease to submit a maintenance ticket');
      return;
    }
    setSubmittingTicket(true);
    try {
      const activeLease = leases[0];
      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          leaseId: activeLease.id,
          propertyId: activeLease.propertyId,
          title: ticketTitle,
          description: ticketDesc,
          category: ticketCategory,
          urgency: ticketUrgency
        })
      });
      setShowTicketModal(false);
      setTicketTitle('');
      setTicketDesc('');
      fetchTenantData();
    } catch (err: any) {
      alert(err.message || 'Failed to file maintenance request');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-indigo-600" />
            Tenant Portal & Lease Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your residential lease agreements, rent payments ledger, and maintenance service requests.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => setShowTicketModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Maintenance
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading your tenant dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Lease & Ledger */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lease Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Active Lease Agreements
              </h2>

              {leases.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No active leases found. Apply for a property to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {leases.map((lease) => (
                    <div key={lease.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 text-sm">Lease Agreement #{lease.id.toUpperCase()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          lease.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lease.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 mb-3">
                        <div>
                          <span className="block text-[10px] text-slate-400">Monthly Rent</span>
                          <span className="font-bold text-slate-900">${lease.monthlyRent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Security Deposit</span>
                          <span className="font-bold text-slate-900">${lease.securityDeposit.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Start Date</span>
                          <span>{lease.startDate}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">End Date</span>
                          <span>{lease.endDate}</span>
                        </div>
                      </div>

                      {lease.status === 'LEASE_OFFERED' && (
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-amber-700 font-medium">Landlord has offered this lease. Review and digitally sign to finalize.</span>
                          <button
                            onClick={() => handleSignLease(lease.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700"
                          >
                            Sign Lease Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rent Payment Ledger */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                Rent Ledger & Payment Receipts
              </h2>

              {payments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No rent payments logged yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Due Date: {p.dueDate} &bull; ${p.amount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.status === 'PAID' ? `Paid on ${new Date(p.paidAt).toLocaleDateString()} (${p.receiptNumber})` : 'Awaiting payment'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === 'PAID' ? (
                          <button
                            onClick={() => setReceiptModal(p)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm"
                          >
                            Pay Rent
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Maintenance Service Requests */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-600" />
              Maintenance Requests
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active or historical maintenance tickets filed.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 line-clamp-1">{t.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        t.urgency === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {t.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{t.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      <span>Category: {t.category}</span>
                      <span className={`font-semibold ${
                        t.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Rent Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Submit Rent Payment</h2>
            <p className="text-xs text-slate-500 mb-4">Due Date: {selectedPayment.dueDate} &bull; Amount: ${selectedPayment.amount.toLocaleString()}</p>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="SANDBOX_ACH">Bank Transfer (ACH - $0 Fee)</option>
                  <option value="SANDBOX_CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-[11px] text-slate-500 block">Sandbox Payment Processor Active</span>
                <span className="font-mono text-slate-700 font-semibold text-xs">Total: ${selectedPayment.amount.toFixed(2)} USD</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {processingPayment ? 'Authorizing...' : 'Authorize Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-bold text-slate-900 text-sm">Official Rent Receipt</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                {receiptModal.receiptNumber}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-slate-600">
              <div className="flex justify-between">
                <span>Tenant:</span>
                <span className="font-semibold text-slate-900">{user?.fullName || 'Sarah Jenkins'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-semibold text-slate-900">${receiptModal.amount.toLocaleString()}.00 USD</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span>{new Date(receiptModal.paidAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Method / Ref:</span>
                <span className="font-mono text-[11px]">{receiptModal.paymentMethod} &bull; {receiptModal.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-600 font-bold uppercase">PAID &bull; CLEARED</span>
              </div>
            </div>

            <button
              onClick={() => setReceiptModal(null)}
              className="w-full py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Request Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Submit Maintenance Request</h2>
            <p className="text-xs text-slate-500 mb-4">Our property maintenance dispatch will review your ticket within 2 hours.</p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="PLUMBING">Plumbing (Leak, Drain, Toilet)</option>
                  <option value="HVAC">Heating / AC / Ventilation</option>
                  <option value="ELECTRICAL">Electrical / Lighting</option>
                  <option value="APPLIANCE">Kitchen / Laundry Appliance</option>
                  <option value="GENERAL">General Repairs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                <select
                  value={ticketUrgency}
                  onChange={(e) => setTicketUrgency(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="STANDARD">Standard (Routine maintenance)</option>
                  <option value="HIGH">High (Impacts daily living)</option>
                  <option value="EMERGENCY">Emergency (Active water leak, no heat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Summary</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Dishwasher leaking from bottom door seal"
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  placeholder="Describe location, symptoms, and best times for technician entry..."
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingTicket ? 'Filing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
