const CACHE_NAME = 'fleksi-v2';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/registro',
  '/manifest.json',
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network first, cache como fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('stripe.com') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ===== PUSH NOTIFICATIONS =====

// Recibir push notification
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    data = { titulo: 'Fleksi', mensaje: event.data?.text() || 'Nueva notificación' };
  }

  const titulo = data.titulo || 'Fleksi';
  const opciones = {
    body: data.mensaje || 'Tienes una nueva notificación',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      link: data.link || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(titulo, opciones)
  );
});

// Click en notificación — abrir la app en el link correcto
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la app ya está abierta, navegar al link
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(link);
          return;
        }
      }
      // Si la app está cerrada, abrirla
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notificaciones') {
    event.waitUntil(sincronizarNotificaciones());
  }
});

async function sincronizarNotificaciones() {
  // Placeholder para sincronización futura
  console.log('Sincronizando notificaciones en background...');
}