// src/services/api.js

import axios from "axios";

/**
 * VITE_API_URL boleh berisi SATU atau BEBERAPA base URL yang dipisah koma.
 * Yang pertama dipakai sebagai utama, sisanya jadi cadangan.
 *
 *   VITE_API_URL="https://totalquality-zeta.vercel.app/api,https://totalquality.co.id/api"
 *
 * Cadangan hanya dipakai ketika backend utama benar-benar tidak terjangkau
 * (gangguan jaringan, CORS ditolak, atau 502/503/504). Error 4xx TIDAK memicu
 * failover: 401 atau 404 adalah jawaban sah dari server, bukan tanda server
 * mati, dan mencoba ulang hanya menutupi masalah sebenarnya.
 *
 * Penting: seluruh base URL harus menunjuk ke database yang sama. Dua backend
 * dengan data berbeda akan membuat panel menampilkan isi yang berganti-ganti
 * tanpa alasan yang terlihat.
 */
function parseBaseUrls(raw) {
  return String(raw ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export const API_BASE_URLS = parseBaseUrls(import.meta.env.VITE_API_URL);

if (API_BASE_URLS.length === 0) {
  // Gagal keras saat build/dev supaya tidak diam-diam menembak origin sendiri
  // (yang tidak punya /api) dan menghasilkan 404 yang membingungkan.
  throw new Error(
    "VITE_API_URL belum di-set. Salin .env.example menjadi .env lalu isi URL API, " +
      'misalnya "https://totalquality.co.id/api". Beberapa URL boleh dipisah koma.'
  );
}

/**
 * Origin website utama, diturunkan dari base URL PERTAMA dengan membuang /api.
 * Dipakai untuk menyusun URL gambar lama yang tersimpan sebagai path relatif
 * dan untuk tautan "Lihat" ke halaman publik.
 */
export const SITE_ORIGIN = API_BASE_URLS[0].replace(/\/api$/, "");

export const TOKEN_KEY = "token";
export const USER_KEY = "user";

/** Base URL yang terbukti jalan pada sesi ini, supaya tidak mencoba ulang terus. */
const ACTIVE_BASE_KEY = "tq_active_api_base";

function readActiveBase() {
  try {
    const saved = sessionStorage.getItem(ACTIVE_BASE_KEY);
    return saved && API_BASE_URLS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function rememberActiveBase(baseURL) {
  try {
    sessionStorage.setItem(ACTIVE_BASE_KEY, baseURL);
  } catch {
    // Mode privat: cukup pakai urutan default.
  }
}

const api = axios.create({
  baseURL: readActiveBase() ?? API_BASE_URLS[0],
  // Tanpa timeout, permintaan yang menggantung membuat tombol "Saving..."
  // berputar selamanya.
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Ubah error axios menjadi Error dengan pesan yang layak ditampilkan.
 * Backend mengirim { error: "..." } atau { message: "..." } tergantung route.
 */
export function toDisplayError(error, fallback = "Terjadi kesalahan") {
  if (error?.code === "ECONNABORTED") {
    return new Error("Permintaan timeout. Periksa koneksi Anda lalu coba lagi.");
  }
  if (error?.response) {
    const data = error.response.data;
    const message =
      (typeof data === "string" && data) ||
      data?.error ||
      data?.message ||
      fallback;
    const wrapped = new Error(message);
    wrapped.status = error.response.status;
    return wrapped;
  }
  if (error?.request) {
    return new Error(
      "Tidak bisa menghubungi server. Periksa koneksi atau pengaturan CORS."
    );
  }
  return error instanceof Error ? error : new Error(fallback);
}

/** Server dianggap tidak terjangkau, bukan sekadar menolak permintaan. */
function isBackendUnreachable(error) {
  const status = error.response?.status;
  if (status) return status === 502 || status === 503 || status === 504;
  // Tidak ada response sama sekali: jaringan putus, DNS gagal, atau CORS ditolak.
  return Boolean(error.request) || error.code === "ECONNABORTED";
}

api.interceptors.response.use(
  (response) => {
    // Simpan base yang berhasil agar permintaan berikutnya langsung ke sana.
    if (response.config?.baseURL) rememberActiveBase(response.config.baseURL);
    return response;
  },
  async (error) => {
    const config = error.config;

    // ── Failover ke base URL cadangan ──────────────────────────────────────
    if (config && API_BASE_URLS.length > 1 && isBackendUnreachable(error)) {
      const tried = config.__triedBases ?? [config.baseURL];
      const next = API_BASE_URLS.find((url) => !tried.includes(url));

      if (next) {
        console.warn(
          `[api] ${config.baseURL} tidak terjangkau, mencoba ${next}`
        );
        return api({
          ...config,
          baseURL: next,
          __triedBases: [...tried, next],
        });
      }
    }

    const status = error.response?.status;

    // Sesi habis / token tidak sah. Jangan redirect kalau sudah di halaman
    // login — itu memicu loop reload tanpa henti.
    if (status === 401 && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.replace(`/login?next=${next}`);
    }

    return Promise.reject(error);
  }
);

export default api;
