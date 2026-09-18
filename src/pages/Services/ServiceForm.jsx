// src\pages\Services\ServiceForm.jsx

import React, { useState, useEffect } from 'react';
import Input from '../../components/Common/Input';
import Textarea from '../../components/Common/TextArea';
import Button from '../../components/Common/Button';
import { Save, X, Upload, Link as LinkIcon } from 'lucide-react';
import notify from "../../lib/notify";

const ServiceForm = ({ service, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
  });

  const [errors, setErrors] = useState({});
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || '',
        description: service.description || '',
        image: service.image || '',
      });
      if (service.image) {
        setImagePreview(service.image);
      }
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update preview for URL
    if (name === 'image' && imageMode === 'url') {
      setImagePreview(value);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageModeChange = (mode) => {
    setImageMode(mode);
    setImageFile(null);
    if (mode === 'upload') {
      setFormData(prev => ({ ...prev, image: '' }));
    }
    setImagePreview('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        notify.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notify.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      // Handle image based on mode
      if (imageMode === 'url' && formData.image.trim()) {
        submitData.image = formData.image.trim();
      } else if (imageMode === 'upload' && imageFile) {
        submitData.imageFile = imageFile;
      }
      
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Enter service title"
        required
        error={errors.title}
        disabled={isLoading}
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Enter service description"
        required
        rows={5}
        error={errors.description}
        disabled={isLoading}
      />

      {/* Image Upload Options */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Image
        </label>
        
        {/* Toggle Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => handleImageModeChange('url')}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${imageMode === 'url' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <LinkIcon size={16} />
            URL
          </button>
          <button
            type="button"
            onClick={() => handleImageModeChange('upload')}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${imageMode === 'upload' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <Upload size={16} />
            Upload
          </button>
        </div>

        {/* URL Input */}
        {imageMode === 'url' && (
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* File Upload */}
        {imageMode === 'upload' && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-3">
            <p className="text-sm text-slate-600 mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Invalid Image</text></svg>';
              }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          icon={Save}
        >
          {isLoading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          icon={X}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ServiceForm;