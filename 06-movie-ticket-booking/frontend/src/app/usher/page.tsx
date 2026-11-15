'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Booking, fetchApi } from '../../lib/api';
import { ShieldCheck, ShieldAlert, Scan, CheckCircle2, AlertOctagon, UserCheck, RefreshCw } from 'lucide-react';

function UsherGateConsole() {
  const { user, token, quickSwitch } = useAuth();
  const [ticketInput, setTicketInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    booking?: Booking;
    message?: string;
    duplicateAlert?: boolean;
    alreadyAdmittedAt?: string;
  } | null>(null);

  const handleScanTicket = async (codeToScan?: string) => {
    const code = (codeToScan || ticketInput).trim();
    if (!code) return;
    if (!token) {
      alert('Please sign in as an usher or administrator.');
      await quickSwitch('usher');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetchApi<{
        success: boolean;
        booking: Booking;
        message: string;
      }>(
        '/usher/scan',
        {
          method: 'POST',
          body: JSON.stringify({ ticketCode: code }),
        },
        token
      );

      setScanResult({
        success: true,
        booking: res.booking,
        message: res.message || 'Admission Granted: Valid Ticket Pass',
      });
      setTicketInput('');
    } catch (err: any) {
      const isDuplicate = err.message.toLowerCase().includes('duplicate') || err.message.toLowerCase().includes('already admitted');
      setScanResult({
        success: false,
        message: err.message,
        duplicateAlert: isDuplicate,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const isUsher = user?.role === 'USHER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Usher Admission Gate</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ticket validation and single-entry gate control. Prevents duplicate admissions.
          </p>
        </div>

        {!isUsher && (
          <button
            onClick={() => quickSwitch('usher')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40 text-xs font-semibold transition-colors"
          >
            Switch to Usher Demo Role
          </button>
        )}
      </div>

      {/* Scanner Control Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Scan / Enter Ticket Pass Code
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Scan className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. TKT-ABC12345 or paste pass code"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleScanTicket()}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              disabled={!ticketInput.trim() || isScanning}
              onClick={() => handleScanTicket()}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center space-x-2 shadow-lg shadow-red-900/30"
            >
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>Validate & Admit</span>
            </button>
          </div>
        </div>

        {/* Quick Test Demo Codes */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs">
          <span className="text-slate-500">Quick Test:</span>
          <button
            onClick={() => {
              setTicketInput('TKT-DEMO1234');
              handleScanTicket('TKT-DEMO1234');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-mono text-[11px]"
          >
            TKT-DEMO1234 (Pre-seeded Confirmed)
          </button>
        </div>

        {/* Scan Status Feedback */}
        {scanResult && (
          <div
            className={`p-6 rounded-2xl border transition-all ${
              scanResult.success
                ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                : scanResult.duplicateAlert
                ? 'bg-amber-950/50 border-amber-600 text-amber-200'
                : 'bg-red-950/50 border-red-700 text-red-200'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="shrink-0 mt-0.5">
                {scanResult.success ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : scanResult.duplicateAlert ? (
                  <AlertOctagon className="w-7 h-7 text-amber-400 animate-pulse" />
                ) : (
                  <ShieldAlert className="w-7 h-7 text-red-400" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">
                    {scanResult.success
                      ? 'ADMISSION GRANTED'
                      : scanResult.duplicateAlert
                      ? 'SECURITY WARNING: DUPLICATE ADMISSION ATTEMPT'
                      : 'ADMISSION DENIED'}
                  </h3>
                  <span className="text-[11px] font-mono uppercase font-semibold">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-90">{scanResult.message}</p>

                {scanResult.booking && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Seats</span>
                      <span className="font-bold text-white">{scanResult.booking.seats.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Booking Ref</span>
                      <span className="font-mono text-white">{scanResult.booking.bookingRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Showtime ID</span>
                      <span className="font-mono text-slate-300">{scanResult.booking.showtimeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">New Status</span>
                      <span className="font-bold text-emerald-400">{scanResult.booking.status}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usher Operating Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-semibold text-slate-200">1. Single Admission Only</div>
          <p>Every ticket pass is strictly invalidated upon first scan to prevent pass copying or multiple entries.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-semibold text-slate-200">2. Real-Time Lock State</div>
          <p>Pending holds that expired or bookings that failed authorization cannot be admitted under any circumstance.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-semibold text-slate-200">3. Duplicate Scan Alarm</div>
          <p>If an already admitted code is rescanned, the system triggers an immediate duplicate entry security warning.</p>
        </div>
      </div>
    </div>
  );
}

export default function UsherPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading usher gate...</div>}>
      <UsherGateConsole />
    </Suspense>
  );
}
