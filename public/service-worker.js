const CACHE_NAME = "medical-spin-v1"
const urlsToCache = ["/", "/clientes", "/historico", "/os/rascunhos", "/offline"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  // Ignora requests que não podem ser cacheados
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith("http")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse
          }

          const responseToCache = networkResponse.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return networkResponse
        })
        .catch(() => caches.match("/offline"))
    }),
  )
})


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
