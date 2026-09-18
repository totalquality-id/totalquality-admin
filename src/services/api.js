// src/services/api.js

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  // Gagal keras saat build/dev supaya tidak diam-diam menembak origin sendiri
  // (yang tidak punya /api) dan menghasilkan 404 yang membingungkan.
  throw new Error(
    "VITE_API_URL belum di-set. Salin .env.example menjadi .env lalu isi URL API, " +
      'misalnya "https://totalquality.co.id/api".'
  );
}

export const TOKEN_KEY = "token";
export const USER_KEY = "user";

const api = axios.create({
  baseURL: API_BASE_URL,
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
