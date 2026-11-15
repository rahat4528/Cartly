import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'CartlyFresh — On-Demand Grocery Delivery',
  description: 'Farm-fresh groceries, reserved 1-hour delivery windows, and customizable item substitution policies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <AuthProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-700">CartlyFresh • Supermarket Delivery Platform</p>
              <p className="mt-1 text-[11px] text-slate-400">
                1-Hour Delivery Capacity Locks • Smart Item Substitution Routing • Single-Store Isolation
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
