import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { FavoritesProvider } from '../lib/favorites-context';
import { ToastProvider } from '../lib/toast-context';

export const metadata: Metadata = {
  title: 'PUJAHOP — Kolkata Durga Puja Smart Navigation & Pandal Hopping Guide',
  description:
    'Kolkata’s premier Durga Puja discovery and navigation platform. Explore 248+ geo-tagged pandals, calculate fastest Metro routes, check crowd levels, and plan your hopping itinerary.',
  keywords: [
    'Durga Puja Kolkata',
    'Pandal Hopping',
    'Kolkata Metro Puja Routes',
    'Sreebhumi Sporting',
    'Baghbazar Sarbojanin',
    'PujaHop',
    'Kolkata festival guide',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#17130F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <FavoritesProvider>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <MobileBottomNav />
            <Footer />
          </FavoritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
