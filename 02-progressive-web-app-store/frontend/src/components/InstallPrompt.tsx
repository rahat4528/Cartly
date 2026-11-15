'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('To install this app on iOS, tap Share and then "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-800/50 p-3 rounded-lg flex items-center justify-between gap-3 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-slate-200">Install Cartly Store for offline access &amp; instant loading</span>
      </div>
      <button
        onClick={handleInstall}
        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1 rounded text-xs transition whitespace-nowrap"
      >
        Install
      </button>
    </div>
  );
}
