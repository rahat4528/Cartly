import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Cartly Stays - Short-Stay Vacation Rentals & Accommodations',
  description: 'Book authentic vacation homes, cabins, beachfront villas, and iconic city stays with instant holds and verified reviews.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-neutral-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500 bg-neutral-50">
            <p>Cartly Stays &copy; 2026. Standalone short-stay vacation rental accommodation marketplace.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
