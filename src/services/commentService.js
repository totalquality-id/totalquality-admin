// src/services/commentService.js
import api, { toDisplayError } from "./api";

/**
 * Moderasi komentar pengunjung untuk Article dan Event.
 *
 * Website memakai moderasi hybrid: komentar yang lolos seluruh filter
 * anti-spam langsung tayang (status "approved"), yang mencurigakan masuk
 * antrean (status "pending") dengan flagReason yang menjelaskan alasannya.
 */
const commentService = {
  /** Seluruh komentar apa pun statusnya, plus jumlah per status. */
  getAll: async ({ status, targetType } = {}) => {
    try {
      const params = {};
      if (status && status !== "all") params.status = status;
      if (targetType && targetType !== "all") params.targetType = targetType;

      const response = await api.get("/comments/moderation", { params });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat komentar");
    }
  },

  /** Ubah status: approved | pending | rejected. */
  setStatus: async (id, status) => {
    try {
      const response = await api.patch(`/comments/${id}`, { status });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal mengubah status komentar");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/comments/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus komentar");
    }
  },
};

export default commentService;
