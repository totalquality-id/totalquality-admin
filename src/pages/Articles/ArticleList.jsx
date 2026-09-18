// src/pages/Articles/ArticleList.jsx

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Grid3x3,
  List,
  Newspaper,
} from "lucide-react";
import articleService from "../../services/articleService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import ArticleForm from "./ArticleForm";
import notify from "../../lib/notify";
import { stripHtml, truncateContent } from "../../lib/htmlText";
import resolveMediaUrl from "../../lib/mediaUrl";

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await articleService.getAll();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load articles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreate = () => {
    setSelectedArticle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (articleItem) => {
    setSelectedArticle(articleItem);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      await articleService.delete(id);
      setArticles(articles.filter((n) => n.id !== id));
      notify.success("Article deleted successfully");
    } catch (err) {
      notify.error("Failed to delete article");
      console.error(err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      if (selectedArticle) {
        const updated = await articleService.update(selectedArticle.id, formData);
        setArticles(articles.map((n) => (n.id === selectedArticle.id ? updated : n)));
        notify.success("Article updated successfully");
      } else {
        const created = await articleService.create(formData);
        setArticles([created, ...articles]);
        notify.success("Article created successfully");
      }

      setIsModalOpen(false);
    } catch (err) {
      notify.error(err.message || "Failed to save article");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setSelectedArticle(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter articles by search term only (tidak ada status published di backend)
  const filteredArticles = articles
    .filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        stripHtml(item.content).toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Articles</h2>
          <p className="text-slate-600 mt-1">Manage Total Quality's articles</p>
        </div>
        <Button onClick={handleCreate} variant="primary" icon={Plus}>
          Add Article
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
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors
              ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            title="Grid View"
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors
              ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            title="List View"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Article Display */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm
              ? "No article found matching your search"
              : "No article yet. Create your first article!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {item.image && (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}

              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-sm mb-3 line-clamp-3">
                  {truncateContent(item.content, 200)}
                </p>

                <div className="text-xs text-slate-500 mb-4">
                  {item.author && <div>By {item.author}</div>}
                  <div>{formatDate(item.createdAt)}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(item)}
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
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
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredArticles.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={resolveMediaUrl(item.image)}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-sm text-slate-500 line-clamp-1">
                          {truncateContent(item.content, 120)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">
                    {item.author || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                      >
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
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
        title={selectedArticle ? "Edit Article" : "Add New Article"}
        size="lg"
      >
        <ArticleForm
          article={selectedArticle}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ArticleList;
