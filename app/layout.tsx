import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fleksi — Tu trabajo, tus reglas',
  description: 'Conectamos personas que necesitan un servicio con quienes pueden hacerlo. Rápido, seguro y flexible.',
  keywords: ['fleksi', 'trabajo flexible', 'servicios', 'flekser', 'empleo', 'freelance', 'México', 'servicios a domicilio'],
  metadataBase: new URL('https://fleksi.vercel.app'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-512-v2.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512-v2.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-512-v2.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fleksi',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    url: 'https://fleksi.vercel.app',
    title: 'Fleksi — Tu trabajo, tus reglas',
    description: 'Conectamos personas que necesitan un servicio con quienes pueden hacerlo. Rápido, seguro y flexible.',
    siteName: 'Fleksi',
    images: [{ url: '/icons/icon-512-v2.png', width: 512, height: 512, alt: 'Fleksi' }],
  },
  twitter: {
    card: 'summary',
    title: 'Fleksi — Tu trabajo, tus reglas',
    description: 'Conectamos personas que necesitan un servicio con quienes pueden hacerlo.',
    images: ['/icons/icon-512-v2.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#7B2FE0',
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
        <link rel="icon" href="/icons/icon-512-v2.png" type="image/png"/>
        <link rel="shortcut icon" href="/icons/icon-512-v2.png" type="image/png"/>
        <link rel="apple-touch-icon" href="/icons/icon-192-v2.png"/>
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512-v2.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="Fleksi"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  // Algunos navegadores (Safari, modo incógnito, iOS) rechazan
                  // el registro del Service Worker. No es un error crítico.
                  console.warn('Service Worker no registrado:', err);
                });
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