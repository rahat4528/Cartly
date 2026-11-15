import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { NetworkStatusPill } from '@/components/NetworkStatusPill';
import { BottomNav } from '@/components/BottomNav';
import { UpdateNotification } from '@/components/UpdateNotification';

export const metadata: Metadata = {
  title: 'Cartly PWA Store — Mobile Hardware & Accessories',
  description: 'Installable progressive web app with offline catalog caching and background synchronization',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen pb-24 antialiased">
        <AuthProvider>
          <NetworkStatusPill />
          <UpdateNotification />
          <main className="max-w-md mx-auto min-h-screen bg-slate-900 border-x border-slate-800 shadow-2xl relative">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
