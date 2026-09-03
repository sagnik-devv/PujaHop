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
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
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
      <head>
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <link rel="shortcut icon" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
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
