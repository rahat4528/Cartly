import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'CartlyRealty — Spatial Property Marketplace',
  description: 'Interactive geospatial property search, immutable price history ledger, and private tour scheduling.',
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
              <p className="font-semibold text-slate-700">CartlyRealty • Spatial Real Estate Platform</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Haversine Spherical Coordinates • Immutable Price Shift Audit • Verified MLS Agent Ownership
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
