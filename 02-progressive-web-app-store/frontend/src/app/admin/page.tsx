'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Bell, Send, RefreshCw, Smartphone, Layers, CheckCircle } from 'lucide-react';

export default function PwaAdminPage() {
  const { user, token, login } = useAuth();

  const [pushTitle, setPushTitle] = useState('Flash Tech Deal');
  const [pushBody, setPushBody] = useState('Complimentary express delivery on spatial audio headphones today.');
  const [broadcasting, setBroadcasting] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  const loadProducts = async () => {
    try {
      const res = await apiRequest('/products');
      setProducts(res.products || []);
    } catch {}
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await apiRequest('/admin/push/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: pushTitle, body: pushBody })
      }, token!);
      setPushFeedback(`Broadcast dispatched to ${res.deliveredCount || 0} registered PWA devices.`);
      setTimeout(() => setPushFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const switchRole = async () => {
    if (user?.role === 'ADMIN') {
      await login('customer@cartly.local', 'Pass123!');
    } else {
      await login('admin@cartly.local', 'AdminPass123!');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center pt-2 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
            Store Administration
          </span>
          <h1 className="text-xl font-bold text-white">Operations Portal</h1>
        </div>

        <button
          onClick={switchRole}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          Role: <strong className="text-cyan-400">{user?.role || 'None'}</strong> (Toggle)
        </button>
      </div>

      {pushFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{pushFeedback}</span>
        </div>
      )}

      {/* Push Notification Broadcaster */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Web Push Device Broadcaster</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Transmit push notifications to installed client PWAs via the Web Push protocol.
        </p>

        <form onSubmit={handleBroadcast} className="space-y-2.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Notification Message</label>
            <textarea
              required
              rows={2}
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={broadcasting}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{broadcasting ? 'Transmitting...' : 'Send Push Alert to Devices'}</span>
          </button>
        </form>
      </div>

      {/* Inventory Monitor */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Store Inventory Telemetry</span>
        </div>

        <div className="space-y-2 text-xs">
          {products.map((p) => (
            <div key={p.id} className="flex justify-between items-center border-b border-slate-700/40 pb-1.5">
              <span className="text-slate-300 truncate max-w-[200px]">{p.title}</span>
              <span className={`font-mono font-bold ${p.stock <= 0 ? 'text-rose-400' : p.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {p.stock} units
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
