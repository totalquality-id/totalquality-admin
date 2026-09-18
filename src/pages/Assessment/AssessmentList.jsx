// src/pages/Assessment/AssessmentList.jsx
//
// Assessment di sistem ini adalah HASIL pengisian dari pengunjung publik,
// bukan template yang dibuat admin. Versi sebelumnya memperlakukannya sebagai
// CRUD penuh: ada tombol Create/Edit/Toggle Active yang memanggil
// assessmentService.create/update/toggleActive. Tidak satu pun fungsi itu ada
// di service, dan backend juga tidak punya endpointnya, sehingga setiap tombol
// melempar TypeError begitu diklik.
//
// Halaman ini sekarang mencerminkan kemampuan backend yang sebenarnya:
// lihat daftar, lihat detail jawaban, hapus, dan ringkasan statistik.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Trash2,
  BarChart,
  Eye,
  FileText,
  User,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import assessmentService from "../../services/assessmentService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import notify from "../../lib/notify";

const TYPE_LABELS = {
  personality: "Personality",
  company: "Company",
};

const TYPE_BADGES = {
  personality: "bg-purple-100 text-purple-700",
  company: "bg-blue-100 text-blue-700",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAssessments(await assessmentService.getAll());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleViewDetail = (assessment) => {
    setSelected(assessment);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Hapus hasil assessment ini? Data jawaban akan hilang permanen."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await assessmentService.delete(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) handleCloseDetail();
      notify.success("Hasil assessment berhasil dihapus");
    } catch (err) {
      notify.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const summary = { total: assessments.length, personality: 0, company: 0 };
    for (const item of assessments) {
      if (item.type in summary) summary[item.type] += 1;
    }
    return summary;
  }, [assessments]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return assessments.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (!q) return true;
      return [item.name, item.job, item.city, item.user?.email]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [assessments, filterType, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Memuat hasil assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hasil Assessment</h2>
          <p className="text-slate-600 mt-1">
            Jawaban self-assessment yang dikirim pengunjung website.
          </p>
        </div>
        <button
          onClick={fetchAssessments}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-600" },
          {
            label: "Personality",
            value: stats.personality,
            color: "bg-purple-500",
          },
          { label: "Company", value: stats.company, color: "bg-blue-500" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm p-5 border border-slate-200"
          >
            <div
              className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}
            >
              <BarChart className="text-white" size={20} />
            </div>
            <p className="text-slate-600 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
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
            placeholder="Cari nama, pekerjaan, kota, atau email..."
            aria-label="Cari hasil assessment"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filter tipe assessment"
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Tipe</option>
          <option value="personality">Personality</option>
          <option value="company">Company</option>
        </select>
      </div>

      {/* Daftar */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 py-16 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {assessments.length === 0
              ? "Belum ada pengunjung yang mengisi assessment."
              : "Tidak ada hasil yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nama</th>
                  <th className="text-left px-4 py-3 font-medium">Tipe</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Pekerjaan
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Kota
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    Tanggal
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.user?.email && (
                        <p className="text-xs text-slate-500">
                          {item.user.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          TYPE_BADGES[item.type] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {item.job || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {item.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="p-2 rounded hover:bg-slate-200 text-slate-600"
                          aria-label={`Lihat detail assessment ${item.name}`}
                          title="Lihat detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded hover:bg-red-50 text-red-600 disabled:opacity-40"
                          aria-label={`Hapus assessment ${item.name}`}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail */}
      <Modal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        title="Detail Hasil Assessment"
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <User size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Nama</p>
                  <p className="font-medium text-slate-800">{selected.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Tanggal</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Pekerjaan</p>
                <p className="font-medium text-slate-800">
                  {selected.job || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Kota</p>
                <p className="font-medium text-slate-800">
                  {selected.city || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Usia</p>
                <p className="font-medium text-slate-800">
                  {selected.age ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Gender</p>
                <p className="font-medium text-slate-800">
                  {selected.gender || "-"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Hasil</h4>
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto max-h-60 text-slate-700">
                {JSON.stringify(selected.results, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Jawaban</h4>
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto max-h-60 text-slate-700">
                {JSON.stringify(selected.answers, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={handleCloseDetail}>
                Tutup
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selected.id)}
                disabled={deletingId === selected.id}
              >
                <Trash2 size={16} className="mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentList;
