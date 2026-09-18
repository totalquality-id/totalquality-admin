// src/services/careerService.js
import api, { toDisplayError } from "./api";

const careerService = {
  // includeClosed=true supaya panel tetap bisa melihat dan membuka kembali
  // lowongan yang sudah ditutup. Endpoint publik tanpa parameter ini hanya
  // mengembalikan lowongan berstatus "open".
  getAll: async () => {
    try {
      const response = await api.get("/careers", {
        params: { includeClosed: "true" },
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat lowongan");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/careers/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat lowongan");
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/careers", {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        location: data.location,
        salary: data.salary || undefined,
        jobType: data.jobType || undefined,
        experience: data.experience || undefined,
        status: data.status || "open",
      });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal membuat lowongan");
    }
  },

  update: async (id, data) => {
    try {
      // Kirim setiap field yang ada di payload, termasuk string kosong, karena
      // backend memperlakukannya sebagai "kosongkan field ini". Versi lama
      // memakai cek truthy sehingga salary/jobType/experience/status tidak
      // pernah ikut terkirim dan perubahannya diam-diam hilang.
      const payload = {};
      const fields = [
        "title",
        "description",
        "requirements",
        "location",
        "salary",
        "jobType",
        "experience",
        "status",
      ];
      for (const key of fields) {
        if (data[key] !== undefined) payload[key] = data[key];
      }

      const response = await api.patch(`/careers/${id}`, payload);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memperbarui lowongan");
    }
  },

  // Buka/tutup lowongan. Sebelumnya dipanggil CareerList tapi tidak pernah
  // didefinisikan, sehingga tombolnya melempar TypeError saat diklik.
  toggleStatus: async (id, status) => {
    try {
      const response = await api.patch(`/careers/${id}`, { status });
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal mengubah status lowongan");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/careers/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus lowongan");
    }
  },
};

export default careerService;
