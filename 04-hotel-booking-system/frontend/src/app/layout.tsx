import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'Cartly Hospitality — Hotel Booking & Reservation Engine',
  description: 'Multi-night hotel booking system with real-time room availability, temporary booking holds, and seasonal pricing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-sand-50 text-slate-800">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-navy-900 text-slate-400 py-8 border-t border-navy-800 mt-16 text-xs text-center">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-serif text-slate-300 font-bold text-sm mb-1">Cartly Hospitality &middot; Hotel Booking System</p>
              <p>Phase 4 Standalone Application &middot; Multi-night inventory reliability, seasonal rate calculation, and atomic holds.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
