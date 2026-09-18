// src/pages/Articles/ArticleForm.jsx

import React, { useState, useEffect } from "react";
import Input from "../../components/Common/Input";
import Button from "../../components/Common/Button";
import RichTextEditor from "../../components/Common/RichTextEditor";
import articleService from "../../services/articleService";
import { Save, X, Link as LinkIcon } from "lucide-react";
import notify from "../../lib/notify";

const ArticleForm = ({ article, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [imageMode, setImageMode] = useState("url");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || "",
        content: article.content || "",
        author: article.author || "",
        image: article.image || "",
      });
      if (article.image) setImagePreview(article.image);
    }
  }, [article]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "image" && imageMode === "url") setImagePreview(value);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Dipanggil oleh RichTextEditor setiap kali konten berubah
  const handleContentChange = (html) => {
    setFormData((prev) => ({ ...prev, content: html }));
    if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
  };

  // Upload gambar inline dari dalam editor
  const handleInlineImageUpload = async (file) => {
    return await articleService.uploadImage(file);
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

    // Cek apakah konten editor kosong (bisa berupa <p><br></p> atau kosong)
    const stripped = formData.content.replace(/<[^>]+>/g, "").trim();
    if (!stripped) newErrors.content = "Content is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      title: formData.title.trim(),
      content: formData.content,   // HTML string
      author: formData.author.trim() || undefined,
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
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Enter article title"
        required
        error={errors.title}
        disabled={isLoading}
      />

      {/* Author */}
      <Input
        label="Author"
        name="author"
        value={formData.author}
        onChange={handleChange}
        placeholder="Author name (optional)"
        disabled={isLoading}
      />

      {/* Headline Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Headline Image <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Gambar utama yang ditampilkan di bagian atas artikel. Untuk gambar di dalam konten, gunakan tombol <strong>Insert Image</strong> di editor.
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

      {/* Rich Text Content */}
      <RichTextEditor
        label="Content"
        value={formData.content}
        onChange={handleContentChange}
        onImageUpload={handleInlineImageUpload}
        error={errors.content}
        disabled={isLoading}
        placeholder="Write your article content here. Use the toolbar to format text, and click 'Insert Image' to add images inside the content..."
        minHeight={350}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={isLoading} icon={Save}>
          {isLoading ? "Saving..." : article ? "Update Article" : "Create Article"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading} icon={X}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ArticleForm;