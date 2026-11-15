'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, FileText, Wrench, 
  UserCheck, AlertCircle, Building, Clock, ChevronRight 
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function LandlordPortalPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue lease modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [leaseStartDate, setLeaseStartDate] = useState('2026-12-01');
  const [leaseEndDate, setLeaseEndDate] = useState('2027-11-30');
  const [issuingLease, setIssuingLease] = useState(false);

  // Maintenance update modal
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string>('SCHEDULED');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  useEffect(() => {
    fetchLandlordData();
  }, [user]);

  const fetchLandlordData = async () => {
    try {
      setLoading(true);
      const [appsData, ticketsData, propsData] = await Promise.all([
        apiRequest('/applications').catch(() => []),
        apiRequest('/maintenance').catch(() => []),
        apiRequest('/properties').catch(() => [])
      ]);
      setApplications(appsData);
      setTickets(ticketsData);
      setProperties(propsData);
    } catch (err) {
      console.error('Error fetching landlord portal data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: string) => {
    try {
      await apiRequest(`/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchLandlordData();
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    }
  };

  const handleIssueLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIssuingLease(true);

    try {
      const property = properties.find(p => p.id === selectedApp.propertyId);
      await apiRequest('/leases', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: selectedApp.propertyId,
          tenantId: selectedApp.applicantId,
          applicationId: selectedApp.id,
          startDate: leaseStartDate,
          endDate: leaseEndDate,
          monthlyRent: property?.monthlyRent || 2500,
          securityDeposit: property?.securityDeposit || 2500
        })
      });

      setSelectedApp(null);
      fetchLandlordData();
      alert('Lease agreement issued to tenant for signature!');
    } catch (err: any) {
      alert(err.message || 'Error generating lease offer');
    } finally {
      setIssuingLease(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setUpdatingTicket(true);

    try {
      await apiRequest(`/maintenance/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: ticketStatus,
          resolutionNotes
        })
      });

      setSelectedTicket(null);
      fetchLandlordData();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingTicket(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            Landlord Property Management Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review confidential applicant screenings, issue digital lease contracts, and track maintenance work orders.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading landlord management console...</div>
      ) : (
        <div className="space-y-8">
          {/* Applications Review Queue */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              Tenant Screening & Application Queue
            </h2>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No tenant applications awaiting review.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{app.applicantName || 'Applicant'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          app.creditScoreBracket === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Credit: {app.creditScoreBracket}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          app.status === 'LEASE_OFFERED' ? 'bg-indigo-100 text-indigo-800' :
                          app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Property: <strong className="text-slate-800">{app.propertyTitle}</strong> &bull; Employer: {app.employerName} &bull; Monthly Income: ${app.monthlyIncome.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Move-in: {app.proposedMoveInDate}</span>
                        <span>Term: {app.proposedLeaseMonths} Months</span>
                        <span>Verified Docs: ID & Paystub</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {app.status !== 'LEASE_OFFERED' && app.status !== 'LEASE_SIGNED' && (
                        <>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Offer Lease
                          </button>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')}
                            className="px-3 py-1.5 border border-rose-300 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-50 transition"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {app.status === 'LEASE_OFFERED' && (
                        <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                          Lease Offered - Awaiting Signature
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Work Orders */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-600" />
              Maintenance Dispatch & Service Orders
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active maintenance service tickets.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          t.urgency === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {t.urgency}
                        </span>
                        <span className="font-semibold text-slate-500 uppercase">{t.category}</span>
                      </div>
                      <p className="text-slate-600 text-xs mb-1">{t.description}</p>
                      {t.resolutionNotes && (
                        <p className="text-[11px] text-emerald-700 font-medium">Notes: {t.resolutionNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded uppercase ${
                        t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setTicketStatus(t.status);
                          setResolutionNotes(t.resolutionNotes || '');
                        }}
                        className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offer Lease Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Issue Residential Lease</h2>
            <p className="text-xs text-slate-500 mb-4">Applicant: {selectedApp.applicantName}</p>

            <form onSubmit={handleIssueLease} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lease Commencement Date</label>
                <input
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lease Expiration Date</label>
                <input
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 py-2 font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingLease}
                  className="flex-1 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {issuingLease ? 'Issuing...' : 'Issue Lease Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Update Maintenance Status</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedTicket.title}</p>

            <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="OPEN">Open (Received)</option>
                  <option value="SCHEDULED">Scheduled with Technician</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved & Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution / Inspection Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Technician dispatched, replaced heating element, tested working..."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2 font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTicket}
                  className="flex-1 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updatingTicket ? 'Saving...' : 'Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
