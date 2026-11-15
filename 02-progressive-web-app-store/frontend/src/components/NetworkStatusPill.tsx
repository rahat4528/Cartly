'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline, pendingCount, syncPendingActions } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<any[] | null>(null);

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot synchronize while offline. Please connect to a network.');
      return;
    }
    setSyncing(true);
    const result = await syncPendingActions();
    setSyncing(false);
    if (result && result.results) {
      setSyncFeedback(result.results);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  return (
    <>
      {/* Top Floating Connectivity & Sync Status Bar */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 text-xs font-sans">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition ${
            isOnline
              ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
          }`}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-semibold">Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <WifiOff className="w-3.5 h-3.5" />
              <span className="font-semibold">Offline Mode</span>
            </>
          )}

          {pendingCount > 0 && (
            <span className="ml-1 bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount} queued
            </span>
          )}
        </div>

        {pendingCount > 0 && isOnline && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg transition text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>

      {/* Sync Outcome Toast */}
      {syncFeedback && syncFeedback.length > 0 && (
        <div className="fixed top-14 right-3 z-50 max-w-sm w-full bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-2xl space-y-2 text-xs">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>Sync Results ({syncFeedback.length} actions)</span>
            <button onClick={() => setSyncFeedback(null)} className="text-slate-500 hover:text-white">&times;</button>
          </div>
          {syncFeedback.map((res, i) => (
            <div key={i} className="flex items-start gap-2">
              {res.status === 'APPLIED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : res.status === 'CONFLICT' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className={`font-bold ${res.status === 'APPLIED' ? 'text-emerald-400' : res.status === 'CONFLICT' ? 'text-amber-400' : 'text-rose-400'}`}>
                  [{res.status}]
                </span>{' '}
                <span className="text-slate-300">{res.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
