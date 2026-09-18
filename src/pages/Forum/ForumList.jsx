// src/pages/Forum/ForumList.jsx

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MessageSquare,
  Pin,
  Lock,
  Unlock,
  Tag,
  User,
  Calendar,
} from "lucide-react";
import forumService from "../../services/forumService";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import ForumForm from "./ForumForm";
import notify from "../../lib/notify";

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await forumService.getAll();
      setPosts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load forum posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = () => {
    setSelectedPost(null);
    setIsModalOpen(true);
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await forumService.delete(id);
      setPosts(posts.filter((p) => p.id !== id));
      notify.success("Post deleted successfully");
    } catch (err) {
      notify.error("Failed to delete post");
      console.error(err);
    }
  };

  const handleTogglePin = async (id, currentStatus) => {
    try {
      const updated = await forumService.togglePin(id, !currentStatus);
      setPosts(posts.map((p) => (p.id === id ? updated : p)));
      notify.success(`Post ${!currentStatus ? "pinned" : "unpinned"} successfully`);
    } catch (err) {
      notify.error("Failed to update pin status");
      console.error(err);
    }
  };

  const handleToggleLock = async (id, currentStatus) => {
    try {
      const updated = await forumService.toggleLock(id, !currentStatus);
      setPosts(posts.map((p) => (p.id === id ? updated : p)));
      notify.success(`Post ${!currentStatus ? "locked" : "unlocked"} successfully`);
    } catch (err) {
      notify.error("Failed to update lock status");
      console.error(err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      if (selectedPost) {
        const updated = await forumService.update(selectedPost.id, formData);
        setPosts(posts.map((p) => (p.id === selectedPost.id ? updated : p)));
        notify.success("Post updated successfully");
      } else {
        const created = await forumService.create(formData);
        setPosts([created, ...posts]);
        notify.success("Post created successfully");
      }

      setIsModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save post");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setSelectedPost(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: "General",
      announcement: "Announcement",
      support: "Support",
      feedback: "Feedback",
      ideas: "Ideas",
      qa: "Q&A",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: "bg-slate-100 text-slate-700",
      announcement: "bg-blue-100 text-blue-700",
      support: "bg-green-100 text-green-700",
      feedback: "bg-purple-100 text-purple-700",
      ideas: "bg-yellow-100 text-yellow-700",
      qa: "bg-orange-100 text-orange-700",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  // Filter posts
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || post.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Pinned posts first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then by date
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading forum posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forum</h2>
          <p className="text-slate-600 mt-1">Manage forum discussions and posts</p>
        </div>
        <Button onClick={handleCreate} variant="primary" icon={Plus}>
          Add Post
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="announcement">Announcements</option>
          <option value="support">Support</option>
          <option value="feedback">Feedback</option>
          <option value="ideas">Ideas</option>
          <option value="qa">Q&A</option>
        </select>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm
              ? "No posts found matching your search"
              : "No forum posts yet. Create your first post!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Title and Badges */}
                  <div className="flex items-start gap-2 mb-2">
                    {post.pinned && (
                      <Pin size={18} className="text-blue-600 flex-shrink-0 mt-1" />
                    )}
                    {post.locked && (
                      <Lock size={18} className="text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-800">
                      {post.title}
                    </h3>
                  </div>

                  {/* Category and Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        post.category
                      )}`}
                    >
                      {getCategoryLabel(post.category)}
                    </span>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-100 text-slate-600"
                          >
                            <Tag size={12} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{post.author?.name || "Admin"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      <span>{post.commentsCount || 0} comments</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleTogglePin(post.id, post.pinned)}
                    variant="outline"
                    size="sm"
                    icon={Pin}
                    className={post.pinned ? "bg-blue-50" : ""}
                  >
                    <span className="hidden sm:inline">
                      {post.pinned ? "Unpin" : "Pin"}
                    </span>
                  </Button>
                  <Button
                    onClick={() => handleToggleLock(post.id, post.locked)}
                    variant="outline"
                    size="sm"
                    icon={post.locked ? Lock : Unlock}
                    className={post.locked ? "bg-red-50" : ""}
                  >
                    <span className="hidden sm:inline">
                      {post.locked ? "Unlock" : "Lock"}
                    </span>
                  </Button>
                  <Button
                    onClick={() => handleEdit(post)}
                    variant="outline"
                    size="sm"
                    icon={Edit}
                  >
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(post.id)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  >
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPost ? "Edit Post" : "Add New Post"}
        size="lg"
      >
        <ForumForm
          post={selectedPost}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default ForumList;