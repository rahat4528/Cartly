import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'CartlyFlights | Flight Search & Itinerary Platform (Demonstration)',
  description: 'Demonstration flight inventory, multi-segment connecting itineraries, seat selection, and e-ticket generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
