// src/services/articleService.js

import api, { toDisplayError } from "./api";

const articleService = {
  // Upload gambar — folder "articles" agar terpisah dari events dan services
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "articles");

      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.url;
    } catch (error) {
      throw toDisplayError(error, "Gagal mengunggah gambar");
    }
  },

  getAll: async () => {
    try {
      const response = await api.get("/articles");
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat articles");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/articles/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memuat article");
    }
  },

  create: async (data) => {
    try {
      let imageUrl = data.image;

      // Jika ada file gambar, upload dulu baru kirim URL-nya
      if (data.imageFile) {
        imageUrl = await articleService.uploadImage(data.imageFile);
      }

      const response = await api.post("/articles", {
        title: data.title,
        content: data.content,
        author: data.author || undefined,
        image: imageUrl || undefined,
      });

      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal membuat article");
    }
  },

  update: async (id, data) => {
    try {
      let imageUrl = data.image;

      if (data.imageFile) {
        imageUrl = await articleService.uploadImage(data.imageFile);
      }

      const payload = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.content !== undefined) payload.content = data.content;
      if (data.author !== undefined) payload.author = data.author;
      if (imageUrl !== undefined) payload.image = imageUrl;

      const response = await api.patch(`/articles/${id}`, payload);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal memperbarui article");
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/articles/${id}`);
      return response.data;
    } catch (error) {
      throw toDisplayError(error, "Gagal menghapus article");
    }
  },
};

export default articleService;
