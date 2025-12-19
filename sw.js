const CACHE_NAME = 'nmmusic-v1';
const STATIC_CACHE = 'nmmusic-static-v1';
const DYNAMIC_CACHE = 'nmmusic-dynamic-v1';

// Risorse da cachare all'installazione
const STATIC_ASSETS = [
  './',
  './index.html',
  './main.css',
  './main.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Installazione Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  
  // Forza il nuovo service worker ad attivarsi subito
  self.skipWaiting();
});

// Attivazione Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  // Prendi il controllo di tutte le pagine immediatamente
  return self.clients.claim();
});

// Intercetta le richieste di rete
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Non cachare chiamate API Firebase
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('ytimg.com')) {
    return; // Lascia passare senza cache
  }
  
  // Strategia: Cache First per risorse statiche
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              return caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, networkResponse.clone());
                  return networkResponse;
                });
            })
            .catch(() => {
              // Fallback per immagini
              if (request.destination === 'image') {
                return caches.match('./icon192.png');
              }
            });
        })
    );
    return;
  }
  
  // Per tutto il resto: Network First
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (request.method === 'GET') {
          return caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Fallback alla index per navigazione
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Background Sync (per future implementazioni)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-playlists') {
    event.waitUntil(
      // Implementa sync logic qui
      Promise.resolve()
    );
  }
});

// Push Notifications (per future implementazioni)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nuova notifica',
    icon: './icon192.png',
    badge: './icon96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('NM Music', options)
  );
});

// Gestione click su notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Message handler per comunicazione con l'app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          return self.clients.claim();
        })
    );
  }
});
