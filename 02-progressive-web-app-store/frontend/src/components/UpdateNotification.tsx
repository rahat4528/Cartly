'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { ArrowUpCircle, X } from 'lucide-react';

export function UpdateNotification() {
  const { updateAvailable, dismissUpdate } = useAuth();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-cyan-950 border border-cyan-500/50 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <ArrowUpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 animate-bounce" />
        <div>
          <p className="font-bold text-white">App Update Available</p>
          <p className="text-cyan-200 text-[11px]">A newer release has been cached for offline use.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded transition"
        >
          Reload
        </button>
        <button onClick={dismissUpdate} className="text-cyan-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
