import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'CartlyDrive — Fleet Vehicle Rental & Escrow System',
  description: 'Tiered daily, weekly, and monthly rates, strict date-overlap locking, and escrow security deposit returns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <AuthProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-slate-800 bg-slate-900 py-8 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-300">CartlyDrive • Enterprise Fleet Rental & Inspection Platform</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Guaranteed Date-Overlap Locking • Multi-Tier Duration Discounts • Return Inspection & Deposit Escrow
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
