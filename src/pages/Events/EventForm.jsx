// src/pages/Events/EventForm.jsx

import React, { useState, useEffect } from "react";
import Input from "../../components/Common/Input";
import Button from "../../components/Common/Button";
import RichTextEditor from "../../components/Common/RichTextEditor";
import eventService from "../../services/eventService";
import { Save, X, Link as LinkIcon } from "lucide-react";
import notify from "../../lib/notify";

const EventForm = ({ event, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [imageMode, setImageMode] = useState("url");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (event) {
      const eventDate = event.date
        ? new Date(event.date).toISOString().slice(0, 16)
        : "";

      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: eventDate,
        location: event.location || "",
        image: event.image || "",
      });

      if (event.image) setImagePreview(event.image);
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "image" && imageMode === "url") setImagePreview(value);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Dipanggil oleh RichTextEditor setiap konten berubah
  const handleDescriptionChange = (html) => {
    setFormData((prev) => ({ ...prev, description: html }));
    if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
  };

  // Upload gambar inline dari dalam editor
  const handleInlineImageUpload = async (file) => {
    return await eventService.uploadImage(file, "events");
  };

  const handleImageModeChange = (mode) => {
    setImageMode(mode);
    setImageFile(null);
    setImagePreview("");
    if (mode === "upload") setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { notify.error("Image size must be less than 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";

    const stripped = formData.description.replace(/<[^>]+>/g, "").trim();
    if (!stripped) newErrors.description = "Description is required";

    if (!formData.date) newErrors.date = "Date and time are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      title: formData.title.trim(),
      description: formData.description,  // HTML string
      date: new Date(formData.date).toISOString(),
      location: formData.location.trim() || undefined,
    };

    if (imageMode === "url" && formData.image.trim()) {
      submitData.image = formData.image.trim();
    } else if (imageMode === "upload" && imageFile) {
      submitData.imageFile = imageFile;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <Input
        label="Event Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Enter event title"
        required
        error={errors.title}
        disabled={isLoading}
      />

      {/* Date & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date & Time"
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          error={errors.date}
          disabled={isLoading}
        />
        <Input
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Event venue"
          disabled={isLoading}
        />
      </div>

      {/* Headline Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Headline Image <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Gambar utama yang ditampilkan di bagian atas event. Untuk gambar di dalam deskripsi, gunakan tombol <strong>Insert Image</strong> di editor.
        </p>

        <div className="flex gap-2 mb-3">
          {["url", "upload"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleImageModeChange(m)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${imageMode === m ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {m === "url" ? <LinkIcon size={14} /> : null}
              {m === "url" ? "URL" : "Upload"}
            </button>
          ))}
        </div>

        {imageMode === "url" ? (
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Max 5MB · JPG, PNG, GIF, WebP</p>
          </div>
        )}

        {imagePreview && (
          <div className="mt-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-sm h-40 object-cover rounded-lg border border-slate-200"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}
      </div>

      {/* Rich Text Description */}
      <RichTextEditor
        label="Description"
        value={formData.description}
        onChange={handleDescriptionChange}
        onImageUpload={handleInlineImageUpload}
        error={errors.description}
        disabled={isLoading}
        placeholder="Write the event description here. Use the toolbar to format text, and click 'Insert Image' to add images inside the description..."
        minHeight={300}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={isLoading} icon={Save}>
          {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading} icon={X}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EventForm;