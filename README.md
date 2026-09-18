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

| Variabel           | Wajib | Keterangan                                    |
| ------------------ | ----- | --------------------------------------------- |
| `VITE_API_URL`     | Ya    | Satu atau beberapa base URL API, dipisah koma |
| `VITE_APP_NAME`    | Tidak | Nama aplikasi                                  |
| `VITE_APP_VERSION` | Tidak | Versi aplikasi                                 |

`VITE_API_URL` yang kosong akan menggagalkan build secara sengaja, supaya
panel tidak diam-diam menembak origin-nya sendiri dan menghasilkan 404.

### Beberapa backend (failover)

`VITE_API_URL` boleh diisi beberapa URL dipisah koma:

```
VITE_API_URL="https://totalquality-zeta.vercel.app/api,https://totalquality.co.id/api"
```

URL pertama dipakai sebagai utama. Cadangan hanya dicoba ketika backend utama
benar-benar **tidak terjangkau** — jaringan putus, CORS ditolak, atau
502/503/504. Respons 4xx **tidak** memicu failover, karena 401 atau 404 adalah
jawaban sah dari server; mencoba ulang hanya akan menutupi masalah sebenarnya.

Base URL yang berhasil disimpan di `sessionStorage` agar permintaan berikutnya
langsung menuju ke sana tanpa mengulang percobaan.

Dua syarat yang harus dipenuhi:

1. **Semua URL menunjuk ke database yang sama.** Backend dengan data berbeda
   akan membuat panel menampilkan isi yang berganti-ganti tanpa sebab jelas.
2. **Semua URL menjalankan versi kode yang sama.** Backend lama yang belum
   punya endpoint baru akan menjawab 404 — dan karena 404 bukan tanda server
   mati, failover tidak akan menolong. Urutkan backend paling baru di depan.

Selain itu, setiap backend harus mencantumkan origin panel ini pada
`ADMIN_ORIGINS` miliknya masing-masing.

---

## Deploy ke Vercel

1. Import repository ini di Vercel. Framework preset: **Vite**
   (`vercel.json` sudah mengunci build command, output directory, SPA rewrite,
   dan security header).
2. Isi Environment Variable `VITE_API_URL` untuk Production, Preview, dan
   Development. Boleh satu URL, atau beberapa dipisah koma untuk failover:

   ```
   https://totalquality-zeta.vercel.app/api,https://totalquality.co.id/api
   ```

   Letakkan backend yang menjalankan kode paling baru di urutan pertama.
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
| Komentar      | `/comments`      | Moderasi komentar pengunjung (Article & Event) |
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
