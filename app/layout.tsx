import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { FavoritesProvider } from '../lib/favorites-context';
import { ToastProvider } from '../lib/toast-context';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://pujonavigation.in'),
  title: 'Pujo Navigation | Kolkata Durga Puja 2026',
  description:
    'Explore Kolkata’s Durga Puja pandals, Metro routes, food stops and Pujo itineraries. Official smart navigation guide with verified pandal directions, crowd trends, and heritage food trails.',
  keywords: [
    'Pujo Navigation',
    'Kolkata Durga Puja 2026',
    'Durga Puja pandals Kolkata',
    'Kolkata Puja route',
    'Durga Puja Metro guide',
    'Kolkata pandal hopping',
    'Sreebhumi Sporting',
    'Baghbazar Sarbojanin',
    'Kolkata festival guide',
  ],
  openGraph: {
    title: 'Pujo Navigation | Kolkata Durga Puja 2026',
    description: 'Explore Kolkata’s Durga Puja pandals, Metro routes, food stops and Pujo itineraries.',
    url: 'https://pujonavigation.in',
    siteName: 'Pujo Navigation',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 1200,
        alt: 'Pujo Navigation Logo',
      },
    ],
  },
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
        <AuthProvider>
          <ToastProvider>
            <FavoritesProvider>
              <Navbar />
              <main style={{ flex: 1 }}>{children}</main>
              <MobileBottomNav />
              <Footer />
            </FavoritesProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
