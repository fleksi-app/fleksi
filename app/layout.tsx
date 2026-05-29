import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fleksi — Tu trabajo, tus reglas',
  description: 'Conectamos personas que necesitan un servicio con quienes pueden hacerlo. Rápido, seguro y flexible.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fleksi',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Fleksi — Tu trabajo, tus reglas',
    description: 'Conectamos personas que necesitan un servicio con quienes pueden hacerlo.',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="icon" href="/icon-512.png" type="image/png"/>
        <link rel="shortcut icon" href="/icon-512.png" type="image/png"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="Fleksi"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }}/>
      </head>
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}