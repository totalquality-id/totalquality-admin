// src/services/statsService.js

import api, { toDisplayError } from "./api";

const statsService = {
  /**
   * Ringkasan untuk Dashboard. Sebelumnya Dashboard memanggil
   * /users/count, /careers/count, /applications/count dan /events/count —
   * keempatnya tidak pernah ada di backend, dan error-nya ditelan .catch()
   * sehingga semua kartu selamanya menampilkan 0.
   */
  getDashboard: async () => {
    try {
      const response = await api.get("/stats/dashboard");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat statistik dashboard");
    }
  },
};

export default statsService;
