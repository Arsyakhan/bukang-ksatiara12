const CACHE_NAME = 'ksatiara-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './bukang_compressed.pdf',
  './music.mp3.mp3',
  './flip.mp3',
  './logo_ksatiara.png',
  './manifest.json'
];

// Install Service Worker & Simpan Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache berhasil dibuka');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ambil data dari Cache agar loading lebih cepat
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Gunakan file dari cache
        }
        return fetch(event.request); // Ambil dari internet jika tidak ada di cache
      })
  );
});
