// src/services/forumService.js
import api, { toDisplayError } from "./api";

const forumService = {
  getAll: async () => {
    try {
      const response = await api.get("/forums");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat quotes");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/forums/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat quote");
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/forums", {
        quote: data.quote,
        author: data.author,
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal membuat quote");
    }
  },

  update: async (id, data) => {
    try {
      // Kirim field yang ada di payload apa adanya. Cek truthy sebelumnya
      // membuat pengosongan nama author diam-diam tidak tersimpan.
      const payload = {};
      if (data.quote !== undefined) payload.quote = data.quote;
      if (data.author !== undefined) payload.author = data.author;

      const response = await api.patch(`/forums/${id}`, payload);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memperbarui quote");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/forums/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus quote");
    }
  },
};

export default forumService;
