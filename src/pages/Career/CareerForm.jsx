// src/pages/Career/CareerForm.jsx
//
// Form ini sebelumnya memuat field department, type, responsibilities dan
// deadline yang tidak ada sama sekali di model Career, jadi isiannya selalu
// dibuang diam-diam saat disimpan. Sebaliknya jobType dan experience ada di
// database tapi tidak punya input. Sekarang form mengikuti schema persis.

import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import Input from "../../components/Common/Input";
import Textarea from "../../components/Common/TextArea";
import Button from "../../components/Common/Button";

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const EMPTY_FORM = {
  title: "",
  location: "",
  description: "",
  requirements: "",
  salary: "",
  jobType: "",
  experience: "",
  status: "open",
};

const CareerForm = ({ career, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!career) {
      setFormData(EMPTY_FORM);
      return;
    }

    setFormData({
      title: career.title || "",
      location: career.location || "",
      description: career.description || "",
      requirements: career.requirements || "",
      salary: career.salary || "",
      jobType: career.jobType || "",
      experience: career.experience || "",
      status: career.status || "open",
    });
  }, [career]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    // Keempat field ini wajib di backend; validasi di sini supaya admin dapat
    // pesan yang jelas sebelum request terkirim.
    if (!formData.title.trim()) nextErrors.title = "Judul lowongan wajib diisi";
    if (!formData.location.trim()) nextErrors.location = "Lokasi wajib diisi";
    if (!formData.description.trim())
      nextErrors.description = "Deskripsi wajib diisi";
    if (!formData.requirements.trim())
      nextErrors.requirements = "Requirements wajib diisi";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      title: formData.title.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      salary: formData.salary.trim(),
      jobType: formData.jobType,
      experience: formData.experience.trim(),
      status: formData.status,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Judul Lowongan"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        required
        disabled={isLoading}
        placeholder="Contoh: Business Consultant"
      />

      <Input
        label="Lokasi"
        name="location"
        value={formData.location}
        onChange={handleChange}
        error={errors.location}
        required
        disabled={isLoading}
        placeholder="Contoh: Surabaya, Indonesia"
      />

      <Textarea
        label="Deskripsi Pekerjaan"
        name="description"
        value={formData.description}
        onChange={handleChange}
        error={errors.description}
        rows={5}
        required
        disabled={isLoading}
      />

      <Textarea
        label="Requirements"
        name="requirements"
        value={formData.requirements}
        onChange={handleChange}
        error={errors.requirements}
        rows={5}
        required
        disabled={isLoading}
        placeholder="Satu kualifikasi per baris"
      />

      <div className="grid sm:grid-cols-2 gap-x-4">
        <Input
          label="Rentang Gaji"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Contoh: Rp 8.000.000 - Rp 12.000.000"
        />

        <Input
          label="Pengalaman"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Contoh: Minimal 2 tahun"
        />

        <div className="mb-4">
          <label
            htmlFor="jobType"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Tipe Pekerjaan
          </label>
          <select
            id="jobType"
            name="jobType"
            value={formData.jobType}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">— Tidak ditentukan —</option>
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="open">Open — tampil di website</option>
            <option value="closed">Closed — tidak menerima lamaran</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="submit" variant="primary" disabled={isLoading} icon={Save}>
          {isLoading ? "Menyimpan..." : career ? "Update Lowongan" : "Buat Lowongan"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          icon={X}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};

export default CareerForm;
