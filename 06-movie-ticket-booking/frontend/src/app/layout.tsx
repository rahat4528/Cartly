import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'Cartly Cinema — Movie Ticket Booking & 2D Seat Matrix',
  description: 'Instant reserved auditorium seating, 8-minute locks, and verifiable QR ticket passes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-screen flex flex-col bg-slate-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>Cartly Cinema • Interactive 2D Seat Matrix & Admission Gate Engine</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Deterministic Hold Timers (8 min) • Single-admission verification • Zero double-booking guarantee
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
