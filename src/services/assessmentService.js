// src/services/assessmentService.js
import api, { toDisplayError } from "./api";

/**
 * Assessment di sistem ini adalah HASIL pengisian dari pengunjung publik,
 * bukan template yang dibuat admin. Backend hanya menyediakan list, detail,
 * statistik, dan hapus.
 *
 * Karena itu panel tidak punya create/update/toggleActive. Sebelumnya
 * AssessmentList memanggil assessmentService.delete(), .toggleActive() dan
 * .update() padahal tidak satu pun pernah didefinisikan di file ini, sehingga
 * tombolnya melempar TypeError begitu diklik.
 */
const assessmentService = {
  getAll: async () => {
    try {
      const response = await api.get("/assessments");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat hasil assessment");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/assessments/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat detail assessment");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/assessments/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus hasil assessment");
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get("/assessments/stats");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat statistik assessment");
    }
  },
};

export default assessmentService;
