const CACHE = 'carnaval-crm-v2'
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

  // Navigation de page (n'importe quelle route de l'app) : toujours le
  // réseau en premier, pour ne jamais servir une page obsolète après un
  // déploiement. Repli sur la page de login en cache si vraiment hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // Fichiers de build Next.js (JS/CSS) : réseau en premier aussi, avec le
  // cache seulement comme repli hors-ligne (évite de rejouer un vieux
  // bundle qui ne correspond plus à la page HTML fraîchement servie).
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => caches.match(request))
    )
    return
  }

  // Assets statiques (logo, icônes, manifest) : cache d'abord, c'est stable.
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
