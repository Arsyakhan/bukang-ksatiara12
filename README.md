# Buku Angkatan Ksatiara 12 — *22 Purnama: Cerita dari Rumah Kita*

Buku digital (flipbook) Angkatan Ksatiara 12 Rumah Kepemimpinan. Aplikasinya PWA statis tanpa proses build.

**Baca online:** https://bukang-ksatiara12.vercel.app

## Fitur

- Halaman bisa dibalik seperti buku. Layar lebar menampilkan 2 halaman, HP tegak 1 halaman. Tampilan bisa diganti lewat tombol di toolbar dan pilihannya diingat.
- Zoom lewat tombol, cubit, atau `+` / `-`. Saat di-zoom, halaman memakai gambar HD dari folder `hd/`.
- Lompat halaman: ketuk penunjuk halaman, geser slider, atau buka tautan `…/#page/20`. Kunjungan berikutnya otomatis lanjut dari halaman terakhir.
- Simpan halaman sebagai gambar, bagikan (WhatsApp, Telegram, Facebook, X, Email; bisa dimulai dari halaman tertentu), unduh PDF ringan atau HD, mode baca penuh, musik latar.
- Bisa dipasang ke layar utama dan dibaca offline (PDF dan musik disimpan di cache).
- Pintasan keyboard: `←` `→` atau `PageUp` `PageDown` untuk pindah halaman, `Home` / `End` ke sampul / halaman terakhir, `+` `-` `0` untuk zoom, `Esc` menutup popup, keluar dari mode baca, atau mengembalikan zoom.

## Isi repo

| Berkas | Fungsi |
| --- | --- |
| `index.html` | Seluruh aplikasi (HTML, CSS, dan JS dalam satu berkas) |
| `sw.js` | Service worker untuk cache dan mode offline |
| `manifest.json` | Pengaturan PWA (nama, ikon, warna) |
| `bukang_compressed.pdf` | Isi buku, 48 halaman (±22 MB), dirender per halaman oleh pdf.js |
| `hd/p-01.jpg` … `p-48.jpg` | Gambar HD tiap halaman, dipakai saat zoom dan saat "Simpan halaman sebagai gambar" |
| `music.mp3`, `flip.mp3` | Musik latar dan suara balik halaman |
| `logo_rk.png`, `icon-*.png`, `apple-touch-icon.png` | Logo dan ikon aplikasi |

Pustaka dimuat dari CDN: [pdf.js](https://mozilla.github.io/pdf.js/) 2.16.105, [StPageFlip](https://github.com/Nodlik/StPageFlip) (`page-flip` 2.0.7), Font Awesome 6.4.0, dan font Nunito. Kalau CDN gagal dimuat, buku menampilkan pesan dengan tombol "Muat ulang" dan tautan unduh PDF.

PDF HD untuk diunduh (±1,2 GB) tidak disimpan di repo, tetapi dilayani lewat [GitHub Releases](https://github.com/Arsyakhan/bukang-ksatiara12/releases/tag/Bukang).

## Menjalankan di komputer sendiri

Tidak ada proses build. Jalankan server statis dari folder repo, lalu buka alamat yang ditampilkan:

```bash
npx serve .
```

Jangan dibuka lewat `file://`: PDF dan service worker butuh `http://localhost` atau HTTPS. Server bawaan Python (`python3 -m http.server`) juga jalan, tetapi tidak mendukung permintaan Range, jadi PDF diunduh penuh dulu dan buku terasa lebih lambat terbuka.

## Deploy

Situs di-deploy ke Vercel sebagai situs statis dari branch `main`: push ke `main` → Vercel otomatis menerbitkan versi baru.

## Menambah atau mengganti gambar HD

Nama berkasnya `hd/p-NN.jpg`, dengan `NN` = **nomor halaman PDF**, bukan nomor yang tercetak di halaman. Sampul adalah halaman PDF 1, jadi halaman yang tercetak "36" adalah `hd/p-37.jpg`. Lebar angka mengikuti jumlah digit total halaman (48 halaman → dua digit: `p-01.jpg`).

Membuat ulang semua gambar dari PDF sumber (butuh `pdftoppm` dari paket `poppler-utils`):

```bash
mkdir -p hd
pdftoppm -jpeg -jpegopt quality=85 -scale-to-x 2000 -scale-to-y -1 BUKU.pdf hd/p
```

Hasilnya `hd/p-01.jpg` … `hd/p-48.jpg` dengan lebar 2000 px. Kalau satu gambar HD tidak ada, buku otomatis memakai render PDF untuk halaman itu: tetap tampil, hanya lebih buram saat di-zoom.

## Aturan cache (penting)

`sw.js` menyimpan PDF, musik, logo, ikon, dan gambar HD dengan strategi *cache dulu*, sedangkan `index.html` selalu diambil dari internet dulu. Jadi:

- **Mengubah `index.html`**: pengunjung langsung mendapat versi baru, tidak perlu apa-apa.
- **Menambah berkas baru** (mis. gambar HD yang sebelumnya belum ada): tidak perlu apa-apa.
- **Mengganti isi berkas yang namanya sama** (PDF, musik, logo, ikon, atau gambar HD): naikkan `CACHE_NAME` di `sw.js` (`v8` → `v9`, dst.) supaya pengunjung yang sudah menyimpan versi lama mendapat yang baru. Pengunjung lalu mengunduh ulang PDF dan musik (±30 MB), jadi lakukan seperlunya saja.
