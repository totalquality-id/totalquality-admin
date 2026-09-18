// src/lib/mediaUrl.js
//
// Database menyimpan dua bentuk URL gambar:
//
//   1. Absolut  — unggahan baru lewat /api/upload, contoh
//                 https://res.cloudinary.com/.../company-profile/articles/x.jpg
//   2. Relatif  — unggahan lama ketika berkas masih disimpan di filesystem
//                 website utama, contoh /hero-images/1771491703711-HERO-2.jpeg
//
// Panel admin berjalan di origin yang BERBEDA dari website utama, jadi path
// relatif tidak boleh dipakai apa adanya: browser akan mencarinya di origin
// panel (localhost:5173 atau domain Vercel) dan gagal. Path relatif harus
// diarahkan ke origin website utama.

const API_URL = import.meta.env.VITE_API_URL ?? "";

/** Origin website utama, diturunkan dari VITE_API_URL dengan membuang /api. */
const SITE_ORIGIN = API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

/**
 * Kembalikan URL gambar yang bisa dimuat dari origin panel admin.
 * Mengembalikan string kosong jika tidak ada gambar, supaya pemanggil bisa
 * menampilkan placeholder.
 */
export function resolveMediaUrl(src) {
  if (!src || typeof src !== "string") return "";

  const trimmed = src.trim();
  if (!trimmed) return "";

  // Sudah absolut (Cloudinary, CDN lain) atau data URI — pakai apa adanya.
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return SITE_ORIGIN ? `${SITE_ORIGIN}${path}` : path;
}

export default resolveMediaUrl;
