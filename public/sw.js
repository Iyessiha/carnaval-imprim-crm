const CACHE = 'carnaval-crm-v1'
const OFFLINE_URL = '/login'

// Assets à mettre en cache au démarrage
const PRECACHE = [
  '/login',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET et les API Supabase
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.startsWith('/api/')) return

  // Network first pour les pages dashboard (toujours à jour)
  if (url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/clients') ||
      url.pathname.startsWith('/devis') ||
      url.pathname.startsWith('/factures')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL) || fetch(request))
    )
    return
  }

  // Cache first pour les assets statiques
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => caches.match(OFFLINE_URL))
    })
  )
})

// Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})
