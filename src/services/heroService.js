// src/services/heroService.js
import api, { toDisplayError } from "./api";

const heroService = {
  // includeInactive=true supaya panel admin tetap bisa melihat (dan
  // mengaktifkan kembali) slide yang sedang dinonaktifkan. Endpoint publik
  // tanpa parameter ini hanya mengembalikan slide aktif.
  getAll: async () => {
    try {
      const response = await api.get("/hero", {
        params: { includeInactive: "true" },
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat hero image");
    }
  },

  // Buat slide hero baru. Payload boleh berisi title, description, order dan
  // isActive. Backend kini membacanya dari FormData yang sama dengan berkas
  // gambarnya; sebelumnya field teks selalu terbuang karena stream formData
  // sudah habis dibaca helper upload.
  create: async ({ file, title, description, order, isActive }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);
      if (order !== undefined && order !== null) {
        formData.append("order", String(order));
      }
      if (isActive !== undefined) formData.append("isActive", String(isActive));

      const response = await api.post("/hero", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menambahkan hero image");
    }
  },

  // Ubah metadata slide: judul, deskripsi, urutan, aktif/nonaktif.
  update: async (id, data) => {
    try {
      const response = await api.patch(`/hero/${id}`, data);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memperbarui hero image");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/hero/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus hero image");
    }
  },
};

export default heroService;

// Named export dipertahankan untuk kode lama yang mengimpor per-fungsi.
export const getHeroes = heroService.getAll;
export const createHero = heroService.create;
export const updateHero = heroService.update;
export const deleteHero = heroService.delete;
