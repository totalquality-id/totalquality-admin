// src/pages/Consultation/ConsultationList.jsx

import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import consultationService from "../../services/consultationService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import notify from "../../lib/notify";

const ConsultationList = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationService.getAll();
      setConsultations(data);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data konsultasi");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleViewDetail = (consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedConsultation(null);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Apakah Anda yakin ingin menghapus data konsultasi ini?")
    ) {
      return;
    }
    try {
      await consultationService.delete(id);
      setConsultations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConsultation?.id === id) {
        handleCloseDetail();
      }
      notify.success("Data konsultasi berhasil dihapus");
    } catch (err) {
      notify.error("Gagal menghapus data konsultasi");
      console.error(err);
    }
  };

  const formatWANumber = (phone) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    } else if (cleaned.startsWith("62")) {
      // sudah benar
    } else if (cleaned.startsWith("+62")) {
      cleaned = cleaned.slice(1);
    }
    return cleaned;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredConsultations = consultations
    .filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat data konsultasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Konsultasi</h2>
          {/* <p className="text-slate-600 mt-1">
            Kelola permintaan konsultasi dari pengunjung website
          </p> */}
        </div>
        <Button onClick={fetchConsultations} variant="outline" icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Permintaan</p>
              <p className="text-2xl font-bold text-slate-800">
                {consultations.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Bulan Ini</p>
              <p className="text-2xl font-bold text-slate-800">
                {
                  consultations.filter((c) => {
                    const d = new Date(c.createdAt);
                    const now = new Date();
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Hari Ini</p>
              <p className="text-2xl font-bold text-slate-800">
                {
                  consultations.filter((c) => {
                    const d = new Date(c.createdAt);
                    const now = new Date();
                    return (
                      d.getDate() === now.getDate() &&
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau nomor telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {filteredConsultations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm
              ? "Tidak ada data yang sesuai dengan pencarian"
              : "Belum ada permintaan konsultasi"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredConsultations.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewDetail(consultation)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {consultation.name}
                          </div>
                          <div className="text-xs text-slate-500 md:hidden">
                            {consultation.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span className="truncate max-w-[200px]">
                            {consultation.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{consultation.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{formatDate(consultation.createdAt)}</span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        onClick={() => handleDelete(consultation.id)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                      >
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        title="Detail"
        size="sm"
      >
        {selectedConsultation && (
          <div className="space-y-5">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {selectedConsultation.name}
                </h3>
                {/* <p className="text-xs text-slate-500">
                  ID: #{selectedConsultation.id}
                </p> */}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Email */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Email</p>
                  <a
                    href={`mailto:${selectedConsultation.email}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {selectedConsultation.email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={15} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Nomor Telepon</p>
                  <a
                    href={`tel:${selectedConsultation.phone}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {selectedConsultation.phone}
                  </a>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    Tanggal Permintaan
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(selectedConsultation.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <a
                href={`mailto:${selectedConsultation.email}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Mail size={15} />
                Email
              </a>
              <a
                href={`https://wa.me/${formatWANumber(selectedConsultation.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Phone size={15} />
                WhatsApp
              </a>
              <Button
                onClick={() => handleDelete(selectedConsultation.id)}
                variant="danger"
                size="md"
                icon={Trash2}
              >
                Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConsultationList;
