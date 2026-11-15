import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Cartly Jobs — Professional Recruitment Marketplace',
  description: 'Connect with verified tech companies, review transparent skill match scores, and track your career pipeline.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
