import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'Cartly Dining — Restaurant Table Reservation & Waitlist Engine',
  description: 'Fine dining table booking with capacity enforcement, table combinations, turnover buffers, and automated waitlist promotions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-wine-950 text-stone-400 py-8 border-t border-wine-900 mt-16 text-xs text-center">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-serif text-stone-300 font-bold text-sm mb-1">Cartly Dining &middot; Restaurant Reservation System</p>
              <p>Phase 5 Standalone Application &middot; Table combination logic, turnover buffer calculations, and automated waitlist promotion.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
