// src\pages\Services\ServiceList.jsx

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Grid3x3, List } from "lucide-react";
import serviceService from "../../services/serviceService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import ServiceForm from "./ServiceForm";
import notify from "../../lib/notify";

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getAll();
      setServices(data);
      setError(null);
    } catch (err) {
      setError("Failed to load services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      await serviceService.delete(id);
      setServices(services.filter((s) => s.id !== id));
      notify.success("Service deleted successfully");
    } catch (err) {
      notify.error("Failed to delete service");
      console.error(err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      // If there's an imageFile, we need to upload it first
      // For now, we'll handle URL-based images directly
      // You'll need to implement file upload to your backend

      const submitData = {
        title: formData.title,
        description: formData.description,
        image: formData.image,
        imageFile: formData.imageFile, // Pass file to service
      };

      if (selectedService) {
        // Update existing service
        const updated = await serviceService.update(
          selectedService.id,
          submitData
        );
        setServices(
          services.map((s) => (s.id === selectedService.id ? updated : s))
        );
        notify.success("Service updated successfully");
      } else {
        // Create new service
        const created = await serviceService.create(submitData);
        setServices([created, ...services]);
        notify.success("Service created successfully");
      }

      setIsModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save service");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setSelectedService(null);
    }
  };

  // Filter services based on search term
  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Services</h2>
          {/* <p className="text-slate-600 mt-1">Manage company services</p> */}
        </div>
        <Button onClick={handleCreate} variant="primary" icon={Plus}>
          Add Service
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search & View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search services..."
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

      {/* Services Display */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-600">
            {searchTerm
              ? "No services found matching your search"
              : "No services yet. Create your first service!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              {service.image && (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}

              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {service.title}
              </h3>

              <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                {service.description}
              </p>

              <div className="text-xs text-slate-500 mb-4">
                Created:{" "}
                {new Date(service.createdAt).toLocaleDateString("id-ID")}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(service)}
                  variant="outline"
                  size="sm"
                  icon={Edit}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(service.id)}
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {service.image && (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">
                          {service.title}
                        </div>
                        <div className="text-sm text-slate-500 lg:hidden">
                          {service.description.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                    <div className="line-clamp-2">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                    {new Date(service.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleEdit(service)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                      >
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(service.id)}
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
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedService ? "Edit Service" : "Add New Service"}
        size="md"
      >
        <ServiceForm
          service={selectedService}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ServiceList;
