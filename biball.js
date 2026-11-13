// Service worker: lets the website work like an app
var CACHE_NAME = "ljc-church-v1";
var FILES = ["index.html", "icon.png", "icon-512.png"];

// 1. Install: save the main files on the phone
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// 2. Activate: remove old saved files
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
             .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: try the internet first, use the saved copy if offline
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== "GET") return;                    // only normal page loads
  if (url.origin !== self.location.origin) return;         // Supabase etc. go straight online
  if (request.headers.has("range")) return;                // music streaming
  if (url.pathname.endsWith("admin.html")) return;         // admin is always live

  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request).then(function (saved) {
          return saved || caches.match("index.html");
        });
      })
  );
});