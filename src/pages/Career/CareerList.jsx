// src/pages/Careers/CareerList.jsx

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Grid3x3,
  List,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import careerService from "../../services/careerService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import CareerForm from "./CareerForm";
import notify from "../../lib/notify";

const CareerList = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all"); // all, open, closed
  const [filterType, setFilterType] = useState("all"); // all, full-time, part-time, etc.

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const data = await careerService.getAll();
      setCareers(data);
      setError(null);
    } catch (err) {
      setError("Failed to load careers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCareers();
  }, []);

  const handleCreate = () => {
    setSelectedCareer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (career) => {
    setSelectedCareer(career);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this career posting?")
    ) {
      return;
    }

    try {
      await careerService.delete(id);
      setCareers(careers.filter((c) => c.id !== id));
      notify.success("Career deleted successfully");
    } catch (err) {
      notify.error("Failed to delete career");
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";
      const updated = await careerService.toggleStatus(id, newStatus);
      setCareers(careers.map((c) => (c.id === id ? updated : c)));
      notify.success(
        `Career ${newStatus === "open" ? "opened" : "closed"} successfully`
      );
    } catch (err) {
      notify.error("Failed to update career status");
      console.error(err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      if (selectedCareer) {
        const updated = await careerService.update(selectedCareer.id, formData);
        setCareers(
          careers.map((c) => (c.id === selectedCareer.id ? updated : c))
        );
        notify.success("Career updated successfully");
      } else {
        const created = await careerService.create(formData);
        setCareers([created, ...careers]);
        notify.success("Career created successfully");
      }

      setIsModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save career");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setSelectedCareer(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getTypeLabel = (type) => {
    const types = {
      "full-time": "Full Time",
      "part-time": "Part Time",
      contract: "Contract",
      internship: "Internship",
      freelance: "Freelance",
    };
    return types[type] || type;
  };

  // Filter careers
  const filteredCareers = careers
    .filter((career) => {
      const matchesSearch =
        career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        career.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        career.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || career.status === filterStatus;

      const matchesType = filterType === "all" || career.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading careers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Careers</h2>
          <p className="text-slate-600 mt-1">
            Manage job postings and openings
          </p>
        </div>
        <Button onClick={handleCreate} variant="primary" icon={Plus}>
          Add Career
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
              placeholder="Search careers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
              title="Grid View"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex gap-2">
            {["all", "open", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                  ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {["all", "full-time", "part-time", "contract", "internship"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                  ${
                    filterType === type
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
                >
                  {type === "all" ? "All Types" : getTypeLabel(type)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Careers Display */}
      {filteredCareers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm
              ? "No careers found matching your search"
              : "No career postings yet. Create your first job opening!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCareers.map((career) => {
            const deadlinePassed = isDeadlinePassed(career.deadline);
            return (
              <div
                key={career.id}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`
                      inline-block px-3 py-1 rounded-full text-xs font-medium
                      ${
                        career.status === "open" && !deadlinePassed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    `}
                  >
                    {career.status === "open" && !deadlinePassed
                      ? "Open"
                      : "Closed"}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {getTypeLabel(career.type)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {career.title}
                </h3>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-600" />
                    <span>{career.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span>{career.location}</span>
                  </div>
                  {career.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-600" />
                      <span>{career.salary}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className={deadlinePassed ? "text-red-600" : ""}>
                      {formatDate(career.deadline)}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {career.description}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleToggleStatus(career.id, career.status)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {career.status === "open" ? "Close" : "Open"}
                  </Button>
                  <Button
                    onClick={() => handleEdit(career)}
                    variant="outline"
                    size="sm"
                    icon={Edit}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(career.id)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  Deadline
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
              {filteredCareers.map((career) => {
                const deadlinePassed = isDeadlinePassed(career.deadline);
                return (
                  <tr key={career.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {career.title}
                        </div>
                        <div className="text-sm text-slate-500">
                          {career.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                        {getTypeLabel(career.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                      {career.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                      <span className={deadlinePassed ? "text-red-600" : ""}>
                        {formatDate(career.deadline)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-block px-3 py-1 rounded-full text-xs font-medium
                          ${
                            career.status === "open" && !deadlinePassed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {career.status === "open" && !deadlinePassed
                          ? "Open"
                          : "Closed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() =>
                            handleToggleStatus(career.id, career.status)
                          }
                          variant="outline"
                          size="sm"
                        >
                          <span className="hidden sm:inline">
                            {career.status === "open" ? "Close" : "Open"}
                          </span>
                        </Button>
                        <Button
                          onClick={() => handleEdit(career)}
                          variant="outline"
                          size="sm"
                          icon={Edit}
                        >
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(career.id)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                        >
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCareer ? "Edit Career" : "Add New Career"}
        size="lg"
      >
        <CareerForm
          career={selectedCareer}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default CareerList;
