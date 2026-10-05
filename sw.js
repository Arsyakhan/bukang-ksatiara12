// Naikkan angka versi ini (v2 -> v3 dst.) setiap kali mengganti PDF/musik/logo
// dengan nama file yang sama, supaya pengunjung mendapat versi terbaru.
const CACHE_NAME = 'ksatiara-pwa-v2';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './bukang_compressed.pdf',
  './music.mp3.mp3',
  './flip.mp3',
  './logo_rk.png',
  './manifest.json'
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
];

// Install: simpan file satu per satu, jadi satu file gagal tidak membatalkan semuanya
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(LOCAL_ASSETS.map(async url => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (err) {
        console.warn('Gagal cache:', url, err);
      }
    }));

    await Promise.all(CDN_ASSETS.map(async url => {
      try {
        const res = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, res);
      } catch (err) {
        console.warn('Gagal cache CDN:', url, err);
      }
    }));
  })());
  self.skipWaiting();
});

// Activate: hapus cache versi lama
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Balasan parsial (206) dari cache. Wajib untuk audio di Safari dan untuk pdf.js
async function handleRange(request) {
  const cached = await caches.match(request.url);
  if (!cached) return fetch(request);

  const buf = await cached.arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!m) return cached;

  let start, end;
  if (m[1] === '' && m[2] !== '') {            // suffix: bytes=-500
    start = Math.max(0, total - parseInt(m[2], 10));
    end = total - 1;
  } else {
    start = m[1] ? parseInt(m[1], 10) : 0;
    end = m[2] ? parseInt(m[2], 10) : total - 1;
  }
  end = Math.min(end, total - 1);

  if (start >= total || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  }

  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

// Halaman HTML: coba internet dulu (agar update selalu muncul), cache sebagai cadangan offline
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    return (await caches.match(request)) ||
           (await caches.match('./index.html')) ||
           (await caches.match('./')) ||
           Response.error();
  }
}

// File statis (PDF, musik, logo, library CDN): cache dulu agar cepat, isi cache saat pertama diambil
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  if (req.headers.has('range')) {
    event.respondWith(handleRange(req));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});
