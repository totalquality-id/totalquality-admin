// src/pages/Applications/ApplicationList.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  Trash2,
  Filter,
  ClipboardList,
  Mail,
  Phone,
  Calendar,
  Briefcase,
} from "lucide-react";
import applicationService from "../../services/applicationService";
import careerService from "../../services/careerService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import ApplicationDetail from "./ApplicationDetail";
import notify from "../../lib/notify";

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCareer, setFilterCareer] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Statistik diturunkan dari data, bukan disimpan terpisah, supaya tidak
  // pernah lagi tidak sinkron dengan daftar setelah update atau delete.
  // Daftar status harus sama dengan validStatuses di applicationController.
  const stats = useMemo(() => {
    const summary = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const application of applications) {
      // "reviewed" adalah nilai lama sebelum pipeline diperluas.
      const key =
        application.status === "reviewed" ? "reviewing" : application.status;
      if (key in summary && key !== "total") summary[key] += 1;
    }
    return summary;
  }, [applications]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [applicationsData, careersData] = await Promise.all([
        applicationService.getAll(),
        careerService.getAll(),
      ]);

      setApplications(applicationsData);
      setCareers(careersData);
      setError(null);
    } catch (err) {
      setError("Failed to load applications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      await applicationService.delete(id);
      const updatedApplications = applications.filter((a) => a.id !== id);
      setApplications(updatedApplications);
      notify.success("Application deleted successfully");
    } catch (err) {
      notify.error("Failed to delete application");
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      setIsUpdating(true);
      const updated = await applicationService.update(id, status, notes);
      const updatedApplications = applications.map((a) =>
        a.id === id ? updated : a
      );
      setApplications(updatedApplications);
      setIsModalOpen(false);
      notify.success("Application status updated successfully");
    } catch (err) {
      notify.error("Failed to update application status");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseModal = () => {
    if (!isUpdating) {
      setIsModalOpen(false);
      setSelectedApplication(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      reviewing: "Reviewing",
      shortlisted: "Shortlisted",
      interview: "Interview",
      accepted: "Accepted",
      rejected: "Rejected",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      reviewing: "bg-blue-100 text-blue-700",
      shortlisted: "bg-purple-100 text-purple-700",
      interview: "bg-indigo-100 text-indigo-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  // Filter applications
  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.career?.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || app.status === filterStatus;

      const matchesCareer =
        filterCareer === "all" || app.careerId === parseInt(filterCareer);

      return matchesSearch && matchesStatus && matchesCareer;
    })
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Job Applications</h2>
        <p className="text-slate-600 mt-1">
          Review and manage candidate applications
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-600" },
          { label: "Pending", value: stats.pending, color: "bg-yellow-600" },
          { label: "Reviewing", value: stats.reviewing, color: "bg-blue-600" },
          {
            label: "Shortlisted",
            value: stats.shortlisted,
            color: "bg-purple-600",
          },
          {
            label: "Interview",
            value: stats.interview,
            color: "bg-indigo-600",
          },
          { label: "Accepted", value: stats.accepted, color: "bg-green-600" },
          { label: "Rejected", value: stats.rejected, color: "bg-red-600" },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-4 border border-slate-200"
          >
            <div
              className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-2`}
            >
              <ClipboardList className="text-white" size={20} />
            </div>
            <p className="text-slate-600 text-xs mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email, phone, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Career Filter */}
          <select
            value={filterCareer}
            onChange={(e) => setFilterCareer(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Positions</option>
            {careers.map((career) => (
              <option key={career.id} value={career.id}>
                {career.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm
              ? "No applications found matching your search"
              : "No applications yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {application.user?.name ?? "-"}
                        </div>
                        <div className="text-sm text-slate-500 lg:hidden">
                          {application.career?.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-blue-600" />
                        <span>{application.career?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} />
                          <span className="truncate max-w-[200px]">
                            {application.user?.email ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} />
                          <span>{application.user?.phone ?? "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" />
                        <span>{formatDate(application.appliedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleViewDetails(application)}
                          variant="outline"
                          size="sm"
                          icon={Eye}
                        >
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(application.id)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                        >
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Application Details */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Application Details"
        size="lg"
      >
        {selectedApplication && (
          <ApplicationDetail
            application={selectedApplication}
            onClose={handleCloseModal}
            onUpdateStatus={handleUpdateStatus}
            isLoading={isUpdating}
          />
        )}
      </Modal>
    </div>
  );
};

export default ApplicationList;
