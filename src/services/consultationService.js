// src/services/consultationService.js

import api from "./api";

const consultationService = {
  getAll: async () => {
    try {
      const response = await api.get("/consultations");
      return response.data;
    } catch (error) {
      console.error("Error fetching consultations:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/consultations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching consultation ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/consultations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting consultation ${id}:`, error);
      throw error;
    }
  },
};

export default consultationService;
