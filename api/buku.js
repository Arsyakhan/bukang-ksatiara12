// api/buku.js
// Meneruskan PDF dari GitHub Releases ke website (supaya tidak kena blokir CORS).
// Alamat di website: /api/buku
export const config = { runtime: 'edge' };

const PDF_URL =
  'https://github.com/Arsyakhan/bukang-ksatiara12/releases/download/Bukang/BUKU.ANGKATAN.FIX.NO.DEBAT.pdf';

export default async function handler(request) {
  // Teruskan permintaan "Range" dari pdf.js supaya buku bisa tampil sebelum semua terunduh
  const upstreamHeaders = new Headers();
  const range = request.headers.get('range');
  if (range) upstreamHeaders.set('range', range);

  let upstream;
  try {
    upstream = await fetch(PDF_URL, { headers: upstreamHeaders, redirect: 'follow' });
  } catch (e) {
    return new Response('Gagal mengambil PDF', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response('PDF tidak ditemukan', { status: 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', 'inline; filename="Buku-Angkatan-Ksatiara-12.pdf"');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) headers.set('Content-Range', contentRange);

  // Content-Length hanya diteruskan kalau isinya tidak dikompres
  if (!upstream.headers.get('content-encoding')) {
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
