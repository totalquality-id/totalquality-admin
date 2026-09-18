// src/pages/Hero/HeroManager.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Upload, Save, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import heroService from "../../services/heroService";
import api, { toDisplayError } from "../../services/api";
import Button from "../../components/Common/Button";
import notify from "../../lib/notify";

const EMPTY_CONTENT = {
  heading: "",
  subheading: "",
  ctaText: "",
  ctaLink: "",
  isActive: true,
};

const HeroManager = () => {
  const [heroes, setHeroes] = useState([]);
  const [file, setFile] = useState(null);
  const [slideMeta, setSlideMeta] = useState({ title: "", description: "" });
  const [content, setContent] = useState(EMPTY_CONTENT);

  const [loadingHeroes, setLoadingHeroes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchHeroes = useCallback(async () => {
    try {
      setLoadingHeroes(true);
      setHeroes(await heroService.getAll());
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLoadingHeroes(false);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      const res = await api.get("/hero-content");
      if (res.data) setContent({ ...EMPTY_CONTENT, ...res.data });
    } catch (error) {
      // Belum ada konten sama sekali bukan kondisi error.
      if (error.response?.status !== 404) {
        notify.error(toDisplayError(error, "Gagal memuat teks hero").message);
      }
    }
  }, []);

  useEffect(() => {
    fetchHeroes();
    fetchContent();
  }, [fetchHeroes, fetchContent]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      notify.error("Pilih berkas gambar terlebih dahulu");
      return;
    }

    setUploading(true);
    try {
      // Slide baru diletakkan di urutan terakhir.
      const nextOrder =
        heroes.reduce((max, hero) => Math.max(max, hero.order ?? 0), -1) + 1;

      await heroService.create({
        file,
        title: slideMeta.title,
        description: slideMeta.description,
        order: nextOrder,
        isActive: true,
      });

      setFile(null);
      setSlideMeta({ title: "", description: "" });
      const input = document.getElementById("heroFileInput");
      if (input) input.value = "";

      notify.success("Gambar hero berhasil ditambahkan");
      await fetchHeroes();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus gambar hero ini? Tindakan ini tidak bisa dibatalkan."))
      return;

    setBusyId(id);
    try {
      await heroService.delete(id);
      setHeroes((prev) => prev.filter((hero) => hero.id !== id));
      notify.success("Gambar hero berhasil dihapus");
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const patchHero = async (id, data, successMessage) => {
    setBusyId(id);
    try {
      const updated = await heroService.update(id, data);
      setHeroes((prev) =>
        prev.map((hero) => (hero.id === id ? { ...hero, ...updated } : hero))
      );
      if (successMessage) notify.success(successMessage);
      return true;
    } catch (error) {
      notify.error(error.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = (hero) =>
    patchHero(
      hero.id,
      { isActive: !hero.isActive },
      hero.isActive ? "Slide dinonaktifkan" : "Slide diaktifkan"
    );

  /** Tukar urutan dengan slide tetangga. */
  const handleMove = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= heroes.length) return;

    const current = heroes[index];
    const neighbour = heroes[target];

    const ok = await patchHero(current.id, { order: neighbour.order ?? target });
    if (!ok) return;
    await patchHero(neighbour.id, { order: current.order ?? index }, "Urutan diperbarui");
    await fetchHeroes();
  };

  const handleMetaBlur = (hero, field, value) => {
    const next = value.trim();
    if ((hero[field] ?? "") === next) return;
    patchHero(hero.id, { [field]: next }, "Teks slide disimpan");
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      await api.post("/hero-content", content);
      notify.success("Teks hero berhasil diperbarui");
    } catch (error) {
      notify.error(toDisplayError(error, "Gagal memperbarui teks hero").message);
    } finally {
      setSavingContent(false);
    }
  };

  const sortedHeroes = [...heroes].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Hero Management</h2>
        <p className="text-slate-600 mt-1">
          Atur teks overlay dan gambar slider pada bagian paling atas website.
        </p>
      </div>

      {/* 1. Teks overlay hero */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Teks Hero (Heading &amp; Subheading)
        </h3>

        <form onSubmit={handleContentSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="hero-heading"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Heading Utama
            </label>
            <input
              id="hero-heading"
              type="text"
              className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={content.heading}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, heading: e.target.value }))
              }
              placeholder="Contoh: UNLEASH YOUR POTENTIAL"
              required
            />
          </div>

          <div>
            <label
              htmlFor="hero-subheading"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Subheading
            </label>
            <textarea
              id="hero-subheading"
              rows="3"
              className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={content.subheading || ""}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, subheading: e.target.value }))
              }
              placeholder="Deskripsi singkat..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="hero-cta-text"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Teks Tombol
              </label>
              <input
                id="hero-cta-text"
                type="text"
                className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={content.ctaText || ""}
                onChange={(e) =>
                  setContent((prev) => ({ ...prev, ctaText: e.target.value }))
                }
                placeholder="Contoh: GET STARTED"
              />
            </div>
            <div>
              <label
                htmlFor="hero-cta-link"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Link Tombol
              </label>
              <input
                id="hero-cta-link"
                type="text"
                className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={content.ctaLink || ""}
                onChange={(e) =>
                  setContent((prev) => ({ ...prev, ctaLink: e.target.value }))
                }
                placeholder="/about atau https://..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingContent}>
              <Save size={16} className="mr-2" />
              {savingContent ? "Menyimpan..." : "Simpan Teks"}
            </Button>
          </div>
        </form>
      </section>

      {/* 2. Slider gambar */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Gambar Background Slider
        </h3>

        <form
          onSubmit={handleUpload}
          className="grid sm:grid-cols-2 gap-4 mb-8 pb-8 border-b border-slate-200"
        >
          <div className="sm:col-span-2">
            <label
              htmlFor="heroFileInput"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Berkas Gambar (maks. 5MB)
            </label>
            <input
              id="heroFileInput"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full border border-slate-300 rounded-md p-2"
            />
          </div>

          <div>
            <label
              htmlFor="slide-title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Judul Slide <span className="text-slate-400">(opsional)</span>
            </label>
            <input
              id="slide-title"
              type="text"
              className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={slideMeta.title}
              onChange={(e) =>
                setSlideMeta((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="slide-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Deskripsi Slide <span className="text-slate-400">(opsional)</span>
            </label>
            <input
              id="slide-description"
              type="text"
              className="block w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={slideMeta.description}
              onChange={(e) =>
                setSlideMeta((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={uploading || !file}>
              <Upload size={16} className="mr-2" />
              {uploading ? "Mengunggah..." : "Upload Gambar"}
            </Button>
          </div>
        </form>

        {loadingHeroes ? (
          <p className="text-slate-500 text-center py-8">Memuat gambar...</p>
        ) : sortedHeroes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Belum ada gambar hero. Unggah gambar pertama Anda di atas.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedHeroes.map((hero, index) => (
              <div
                key={hero.id}
                className={`rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ${
                  busyId === hero.id ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {/* hero.image sudah berupa URL absolut dari Cloudinary.
                    Versi lama menempelkan "http://localhost:3000" di depannya,
                    sehingga semua gambar di panel ini gagal dimuat. */}
                <img
                  src={hero.image}
                  alt={hero.title || `Hero slide ${index + 1}`}
                  className="w-full h-36 object-cover bg-slate-200"
                  loading="lazy"
                />

                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    defaultValue={hero.title ?? ""}
                    onBlur={(e) => handleMetaBlur(hero, "title", e.target.value)}
                    placeholder="Judul slide"
                    aria-label="Judul slide"
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    defaultValue={hero.description ?? ""}
                    onBlur={(e) =>
                      handleMetaBlur(hero, "description", e.target.value)
                    }
                    placeholder="Deskripsi slide"
                    aria-label="Deskripsi slide"
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Naikkan urutan"
                        title="Naikkan urutan"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === sortedHeroes.length - 1}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Turunkan urutan"
                        title="Turunkan urutan"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(hero)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        aria-label={
                          hero.isActive
                            ? "Nonaktifkan slide"
                            : "Aktifkan slide"
                        }
                        title={
                          hero.isActive
                            ? "Slide tampil di website"
                            : "Slide disembunyikan"
                        }
                      >
                        {hero.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(hero.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        aria-label="Hapus slide"
                        title="Hapus slide"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HeroManager;
