// src/pages/Applications/ApplicationDetail.jsx

import React, { useState } from "react";
import Button from "../../components/Common/Button";
import Textarea from "../../components/Common/TextArea";
import notify from "../../lib/notify";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Save,
} from "lucide-react";

const ApplicationDetail = ({
  application,
  onClose,
  onUpdateStatus,
  isLoading,
}) => {
  const [status, setStatus] = useState(application.status || "pending");
  const [notes, setNotes] = useState(application.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      value: "reviewing",
      label: "Reviewing",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "shortlisted",
      label: "Shortlisted",
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "interview",
      label: "Interview",
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      value: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-700",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus(application.id, status, notes);
    } catch (error) {
      notify.error(error.message || "Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-slate-500" />
          <span>{application.user?.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-slate-500" />
          <span>{application.user?.phone || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-500" />
          <span>{application.user?.address || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-slate-500" />
          <span>{application.career?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <span>
            Applied: {new Date(application.appliedAt).toLocaleDateString("id-ID")}
          </span>
        </div>
      </div>

      {/* Cover Letter, etc. */}
      <Textarea
        label="Cover Letter"
        value={application.coverLetter || "N/A"}
        readOnly
        rows={4}
      />
      <Input
        label="Expected Salary"
        value={application.expectedSalary || "N/A"}
        readOnly
      />
      <Input
        label="Available Date"
        value={
          application.availableDate
            ? new Date(application.availableDate).toLocaleDateString()
            : "N/A"
        }
        readOnly
      />

      {/* Status Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={isLoading || isSaving}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        label="Internal Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        disabled={isLoading || isSaving}
      />

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          variant="primary"
          disabled={isLoading || isSaving}
          icon={Save}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          disabled={isLoading || isSaving}
          icon={X}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetail;
