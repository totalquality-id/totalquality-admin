// src/pages/Forum/ForumList.jsx
//
// Model Forum di backend hanya berisi { quote, author, likes, shares,
// createdAt } -- isinya adalah kutipan yang tampil di halaman /forum website.
//
// Versi sebelumnya dibangun untuk model diskusi yang sama sekali berbeda:
// membaca post.title, post.content, post.author.name, post.category,
// post.tags dan post.pinned. Tidak satu pun field itu ada, sehingga kotak
// pencarian tidak pernah cocok, badge kategori selalu menampilkan "undefined",
// filter kategori tidak menyaring apa pun, dan sort "pinned" tidak berefek.

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MessageSquare,
  Heart,
  Share2,
  User,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import forumService from "../../services/forumService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import ForumForm from "./ForumForm";
import notify from "../../lib/notify";

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "likes", label: "Paling disukai" },
  { value: "shares", label: "Paling dibagikan" },
];

const formatDate = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const ForumList = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      setQuotes(await forumService.getAll());
    } catch (err) {
      setError(err.message || "Gagal memuat quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleCreate = () => {
    setSelectedQuote(null);
    setIsModalOpen(true);
  };

  const handleEdit = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedQuote(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus quote ini? Tindakan ini tidak bisa dibatalkan."))
      return;

    setDeletingId(id);
    try {
      await forumService.delete(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      notify.success("Quote berhasil dihapus");
    } catch (err) {
      notify.error(err.message || "Gagal menghapus quote");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedQuote) {
        const updated = await forumService.update(selectedQuote.id, formData);
        setQuotes((prev) =>
          prev.map((q) => (q.id === selectedQuote.id ? { ...q, ...updated } : q))
        );
        notify.success("Quote berhasil diperbarui");
      } else {
        const created = await forumService.create(formData);
        setQuotes((prev) => [created, ...prev]);
        notify.success("Quote berhasil dibuat");
      }
      setIsModalOpen(false);
      setSelectedQuote(null);
    } catch (err) {
      notify.error(err.message || "Gagal menyimpan quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = useMemo(
    () =>
      quotes.reduce(
        (acc, q) => ({
          likes: acc.likes + (q.likes ?? 0),
          shares: acc.shares + (q.shares ?? 0),
        }),
        { likes: 0, shares: 0 }
      ),
    [quotes]
  );

  const visibleQuotes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = quotes.filter((item) => {
      if (!q) return true;
      return (
        item.quote?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q)
      );
    });

    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      likes: (a, b) => (b.likes ?? 0) - (a.likes ?? 0),
      shares: (a, b) => (b.shares ?? 0) - (a.shares ?? 0),
    };

    return [...filtered].sort(sorters[sortBy] ?? sorters.newest);
  }, [quotes, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Memuat quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forum Quotes</h2>
          <p className="text-slate-600 mt-1">
            Kutipan yang tampil di halaman Forum website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuotes}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Button variant="primary" onClick={handleCreate} icon={Plus}>
            Tambah Quote
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Quote",
            value: quotes.length,
            Icon: MessageSquare,
            color: "bg-indigo-500",
          },
          {
            label: "Total Likes",
            value: totals.likes,
            Icon: Heart,
            color: "bg-rose-500",
          },
          {
            label: "Total Shares",
            value: totals.shares,
            Icon: Share2,
            color: "bg-sky-500",
          },
        ].map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-lg shadow-sm p-5 border border-slate-200"
          >
            <div
              className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}
            >
              <Icon className="text-white" size={20} />
            </div>
            <p className="text-slate-600 text-sm">{label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {/* Pencarian & urutan */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari isi quote atau nama penulis..."
            aria-label="Cari quote"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Urutkan quote"
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar */}
      {visibleQuotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {quotes.length === 0
              ? "Belum ada quote. Tambahkan quote pertama Anda."
              : "Tidak ada quote yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleQuotes.map((item) => (
            <article
              key={item.id}
              className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col ${
                deletingId === item.id ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <blockquote className="text-slate-800 leading-relaxed border-l-4 border-blue-500 pl-4 mb-4 flex-1">
                {item.quote}
              </blockquote>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} />
                  {item.author || "Anonim"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formatDate(item.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-500" />
                  {item.likes ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Share2 size={14} className="text-sky-500" />
                  {item.shares ?? 0}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(item)}
                  icon={Edit}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  icon={Trash2}
                >
                  Hapus
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedQuote ? "Edit Quote" : "Tambah Quote"}
      >
        <ForumForm
          post={selectedQuote}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ForumList;
