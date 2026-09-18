// src/pages/Comments/CommentList.jsx
//
// Antrean moderasi komentar pengunjung (Article & Event).
//
// Website memakai moderasi hybrid: komentar yang lolos seluruh filter
// anti-spam langsung tayang, yang mencurigakan masuk ke sini dengan
// flagReason yang menjelaskan mengapa ia ditahan.

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Check,
  X,
  Trash2,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Mail,
} from "lucide-react";
import commentService from "../../services/commentService";
import { SITE_ORIGIN } from "../../services/api";
import Button from "../../components/Common/Button";
import notify from "../../lib/notify";

const STATUS_TABS = [
  { value: "pending", label: "Perlu ditinjau" },
  { value: "approved", label: "Tayang" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua" },
];

const STATUS_BADGE = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABEL = {
  approved: "Tayang",
  pending: "Ditinjau",
  rejected: "Ditolak",
};

const TARGET_LABEL = { article: "Article", event: "Event" };

const formatDate = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const CommentList = () => {
  const [comments, setComments] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [status, setStatus] = useState("pending");
  const [targetType, setTargetType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getAll({ status, targetType });
      setComments(data.comments ?? []);
      setCounts(data.counts ?? {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, targetType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSetStatus = async (id, nextStatus) => {
    setBusyId(id);
    try {
      await commentService.setStatus(id, nextStatus);
      notify.success(
        nextStatus === "approved"
          ? "Komentar ditayangkan"
          : nextStatus === "rejected"
            ? "Komentar ditolak"
            : "Komentar dikembalikan ke antrean"
      );
      await fetchComments();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Hapus komentar ini permanen? Tindakan ini tidak bisa dibatalkan."
      )
    ) {
      return;
    }

    setBusyId(id);
    try {
      await commentService.delete(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      notify.success("Komentar dihapus");
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const query = searchTerm.trim().toLowerCase();
  const visible = query
    ? comments.filter((c) =>
        [c.name, c.content, c.email]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))
      )
    : comments;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Komentar</h2>
          <p className="text-slate-600 mt-1">
            Komentar pengunjung pada Article dan Event.
          </p>
        </div>
        <button
          onClick={fetchComments}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", key: "total", color: "bg-slate-600" },
          { label: "Perlu ditinjau", key: "pending", color: "bg-amber-500" },
          { label: "Tayang", key: "approved", color: "bg-emerald-500" },
          { label: "Ditolak", key: "rejected", color: "bg-red-500" },
        ].map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-lg shadow-sm p-4 border border-slate-200"
          >
            <div
              className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center mb-2`}
            >
              <MessageSquare className="text-white" size={18} />
            </div>
            <p className="text-slate-600 text-xs">{card.label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {(counts[card.key] ?? 0).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                status === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && counts[tab.value] > 0 && (
                <span className="ml-1.5 text-xs opacity-80">
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, isi komentar, atau email..."
              aria-label="Cari komentar"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            aria-label="Filter sumber komentar"
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Sumber</option>
            <option value="article">Article</option>
            <option value="event">Event</option>
          </select>
        </div>
      </div>

      {/* Daftar */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-3 text-slate-600 text-sm">Memuat komentar...</p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {comments.length === 0
              ? "Tidak ada komentar pada filter ini."
              : "Tidak ada komentar yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((comment) => {
            const targetUrl = SITE_ORIGIN
              ? `${SITE_ORIGIN}/${comment.targetType === "article" ? "articles" : "events"}/${comment.targetId}`
              : null;

            return (
              <article
                key={comment.id}
                className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 ${
                  busyId === comment.id ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-medium text-slate-800">
                    {comment.name}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_BADGE[comment.status] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_LABEL[comment.status] ?? comment.status}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                    {TARGET_LABEL[comment.targetType] ?? comment.targetType} #
                    {comment.targetId}
                  </span>

                  {targetUrl && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      title="Buka halaman terkait"
                    >
                      <ExternalLink size={12} />
                      Lihat
                    </a>
                  )}

                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                {comment.flagReason && (
                  <div className="mb-3 inline-flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg">
                    <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Ditahan filter: {comment.flagReason}</span>
                  </div>
                )}

                {/* Komentar selalu ditampilkan sebagai teks biasa, tidak
                    pernah dirender sebagai HTML. */}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words mb-3">
                  {comment.content}
                </p>

                {comment.email && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Mail size={12} />
                    {comment.email}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {comment.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="success"
                      icon={Check}
                      onClick={() => handleSetStatus(comment.id, "approved")}
                    >
                      Tayangkan
                    </Button>
                  )}
                  {comment.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={X}
                      onClick={() => handleSetStatus(comment.id, "rejected")}
                    >
                      Tolak
                    </Button>
                  )}
                  {comment.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Clock}
                      onClick={() => handleSetStatus(comment.id, "pending")}
                    >
                      Kembalikan ke antrean
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(comment.id)}
                    className="ml-auto"
                  >
                    Hapus
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentList;
