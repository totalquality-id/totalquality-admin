// src/services/applicationService.js

import api, { toDisplayError } from "./api";

const applicationService = {
  getAll: async () => {
    try {
      const response = await api.get("/applications");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat lamaran");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat detail lamaran");
    }
  },

  getByCareer: async (careerId) => {
    try {
      const response = await api.get(`/applications/career/${careerId}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat lamaran untuk lowongan ini");
    }
  },

  update: async (id, status, notes) => {
    try {
      const response = await api.patch(`/applications/${id}`, {
        status,
        notes,
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memperbarui status lamaran");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus lamaran");
    }
  },
};

// Catatan: downloadResume() dan getStatistics() dihapus dari service ini.
// Keduanya memanggil /applications/{id}/resume dan /applications/statistics
// yang tidak ada di backend, dan schema Application tidak punya kolom berkas
// CV sama sekali. Statistik per status dihitung di ApplicationList dari data
// yang sudah diambil, tanpa request tambahan.

export default applicationService;
