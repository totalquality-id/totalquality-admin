# Total Quality — Admin Panel

Panel administrasi konten untuk website [Total Quality Indonesia](https://totalquality.co.id).
Dibangun dengan React 19 + Vite + Tailwind CSS v3, dan berkomunikasi dengan
API Next.js milik website utama.

---

## Arsitektur singkat

```
totalquality-admin (React SPA)          totalquality (Next.js)
  browser admin                            /api/*
      |                                       |
      |  1. POST /api/auth/login              |
      |-------------------------------------->|  verifikasi email + password
      |<--------------------------------------|  { user, token }  (JWT, 7 hari)
      |                                       |
      |  2. Setiap request berikutnya:        |
      |     Authorization: Bearer <token>     |
      |-------------------------------------->|  requireAdmin() memeriksa
      |                                       |  signature + role === "admin"
```

Poin penting:

- **Panel ini tidak memegang satu pun secret.** Semua variabel `VITE_*` ikut
  ter-bundle ke JavaScript yang dikirim ke browser, jadi isinya hanya URL API
  publik. Otorisasi sepenuhnya dilakukan backend lewat JWT.
- **CORS bukan pengaman.** Origin panel harus terdaftar di `ADMIN_ORIGINS`
  pada environment website utama agar browser mengizinkan responsnya dibaca,
  tetapi pengaman sebenarnya adalah `requireAdmin()` di setiap endpoint tulis.
- Login menolak akun non-admin sebelum token disimpan, dan `ProtectedRoute`
  memverifikasi ulang token ke `/api/auth/verify` setiap kali panel dibuka.

---

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env    # lalu sesuaikan VITE_API_URL
npm run dev
```

Panel berjalan di `http://localhost:5173`. Origin ini sudah ada di daftar
`DEFAULT_ORIGINS` website utama, jadi tidak perlu konfigurasi CORS tambahan
untuk development.

| Script            | Fungsi                              |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev server dengan hot reload        |
| `npm run build`   | Build produksi ke `dist/`           |
| `npm run preview` | Pratinjau hasil build secara lokal  |
| `npm run lint`    | ESLint                              |

---

## Environment

| Variabel           | Wajib | Keterangan                                          |
| ------------------ | ----- | --------------------------------------------------- |
| `VITE_API_URL`     | Ya    | Base URL API, lengkap dengan `/api`                 |
| `VITE_APP_NAME`    | Tidak | Nama aplikasi                                        |
| `VITE_APP_VERSION` | Tidak | Versi aplikasi                                       |

`VITE_API_URL` yang kosong akan menggagalkan build secara sengaja, supaya
panel tidak diam-diam menembak origin-nya sendiri dan menghasilkan 404.

---

## Deploy ke Vercel

1. Import repository ini di Vercel. Framework preset: **Vite**
   (`vercel.json` sudah mengunci build command, output directory, SPA rewrite,
   dan security header).
2. Isi Environment Variable `VITE_API_URL` = `https://totalquality.co.id/api`
   untuk Production, Preview, dan Development.
3. Setelah deployment pertama, catat URL produksinya, lalu **tambahkan URL itu
   ke `ADMIN_ORIGINS` di environment website utama** dan restart website utama:

   ```
   ADMIN_ORIGINS="https://admin.tq.tqpartner.my.id,https://<url-vercel-anda>"
   ```

   Tanpa langkah ini semua request dari panel akan diblokir browser karena CORS.

`vercel.json` sudah memasang `X-Robots-Tag: noindex` dan `X-Frame-Options: DENY`,
dan `public/robots.txt` melarang crawler, supaya panel internal tidak muncul di
hasil pencarian.

---

## Modul

| Menu          | Route            | Kemampuan                                      |
| ------------- | ---------------- | ---------------------------------------------- |
| Dashboard     | `/`              | Ringkasan jumlah seluruh konten                |
| Hero Image    | `/hero`          | Teks hero, slider gambar, urutan, aktif/nonaktif |
| Services      | `/services`      | CRUD layanan                                   |
| Events        | `/events`        | CRUD kegiatan                                  |
| Articles      | `/articles`      | CRUD artikel (rich text + gambar)              |
| Careers       | `/careers`       | CRUD lowongan, buka/tutup status               |
| Applications  | `/applications`  | Review lamaran, ubah status, hapus             |
| Forum         | `/forum`         | CRUD quotes                                    |
| Consultations | `/consultations` | Daftar permintaan konsultasi, hapus            |
| Assessments   | `/assessments`   | Hasil self-assessment pengunjung (read + hapus) |

Assessments sengaja tidak punya Create/Edit: isinya adalah hasil pengisian
dari pengunjung publik, bukan template yang dibuat admin.

---

## Catatan migrasi

- Modul **News** sudah diganti menjadi **Articles**. Endpoint `/api/news`
  masih hidup sebagai alias di backend, tetapi panel ini sudah sepenuhnya
  memakai `/api/articles`. Route lama `/news` diarahkan ke `/articles`.
- Token admin disimpan di `localStorage`. Ini berarti XSS pada panel dapat
  mencuri sesi. Peningkatan berikutnya: pindah ke cookie `httpOnly` + `SameSite`
  yang di-set oleh Next.js.
