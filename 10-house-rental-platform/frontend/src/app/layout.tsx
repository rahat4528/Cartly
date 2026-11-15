import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Cartly Living - House Rental Platform & Residential Leasing',
  description: 'Long-term residential leasing, background applications, tour scheduling, lease signing, and tenant maintenance portal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs">
            <p>Cartly Living &copy; 2026. Confidential Tenant Screening & Residential Lease Management.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
