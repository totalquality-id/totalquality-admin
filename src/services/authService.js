// src/services/authService.js

import api, { TOKEN_KEY, USER_KEY, toDisplayError } from "./api";

/**
 * Catatan keamanan: token disimpan di localStorage agar sesi bertahan setelah
 * refresh. Ini berarti XSS di panel bisa mencuri token. Mitigasi yang sudah ada:
 * panel tidak pernah merender HTML dari input user, dan backend mewajibkan
 * role admin pada setiap endpoint tulis. Peningkatan lanjutan: pindah ke cookie
 * httpOnly + SameSite di sisi Next.js.
 */
const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (!response.data?.success || !response.data?.data) {
        throw new Error("Format respons login tidak dikenali");
      }

      const { user, token } = response.data.data;

      if (user?.role !== "admin") {
        // Jangan simpan apa pun kalau bukan admin.
        throw new Error("Akses ditolak. Akun ini bukan administrator.");
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error) {
      throw toDisplayError(error, "Login gagal");
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace("/login");
  },

  /** Bersihkan sesi tanpa memicu navigasi (dipakai saat verifikasi gagal). */
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Data rusak — perlakukan sebagai belum login.
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  isAuthenticated: () =>
    Boolean(authService.getToken() && authService.getCurrentUser()),

  isAdmin: () => authService.getCurrentUser()?.role === "admin",

  /**
   * Verifikasi token ke server. Membedakan "token tidak sah" (harus logout)
   * dari "server tidak terjangkau" (jangan buang sesi user).
   */
  verifyToken: async () => {
    try {
      const response = await api.get("/auth/verify");
      const user = response.data?.data?.user;

      if (!user) return { ok: false, reason: "invalid" };

      if (user.role !== "admin") {
        authService.clearSession();
        return { ok: false, reason: "forbidden" };
      }

      // Segarkan cache user supaya perubahan nama/role ikut terbawa.
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ok: true, user };
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        authService.clearSession();
        return { ok: false, reason: "invalid" };
      }

      // Jaringan/server bermasalah: pertahankan sesi, tampilkan pesan.
      return {
        ok: false,
        reason: "network",
        message: toDisplayError(error).message,
      };
    }
  },
};

export default authService;
