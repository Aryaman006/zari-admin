"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Edit2, Trash2, ChevronRight, X, Save, Upload } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Category } from "@zari/shared-types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

type CategoryForm = {
  name: string;
  description: string;
  image_url: string;
  parent_id: string;
  is_active: boolean;
};

const EMPTY_FORM: CategoryForm = { name: "", description: "", image_url: "", parent_id: "", is_active: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const key = `categories/${Date.now()}-${file.name}`;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/uploads/direct?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_access_token")}`,
          },
        }
      );
      
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setForm((f) => ({ ...f, image_url: result.public_url }));
      toast.success("Category image uploaded!");
    } catch {
      toast.error("Failed to upload category image.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listCategories();
      setCategories(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      image_url: cat.image_url ?? "",
      parent_id: cat.parent_id ?? "",
      is_active: cat.is_active,
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      image_url: form.image_url || null,
      parent_id: form.parent_id || null,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCategory(id);
      setDeleteConfirm(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Cannot delete — category may have products.");
    }
  };

  // Flat list of parent-only categories for the parent dropdown
  const parentOptions = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">{categories.length} categories</p>
        </div>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={15} />New Category
        </button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="card"
            style={{ padding: "24px 28px", marginBottom: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                {editing ? `Edit: ${editing.name}` : "Create New Category"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-dim)" }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", marginBottom: 16,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--admin-radius-sm)", color: "#EF4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Name *</label>
                  <input
                    id="cat-name"
                    className="admin-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Lehengas"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Parent Category</label>
                  <select
                    id="cat-parent"
                    className="admin-input"
                    value={form.parent_id}
                    onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  >
                    <option value="">None (top-level)</option>
                    {parentOptions
                      .filter((c) => !editing || c.id !== editing.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="admin-form-label">Description</label>
                  <textarea
                    id="cat-description"
                    className="admin-input"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of this category"
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="admin-form-label">Category Image</label>
                  {form.image_url ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ position: "relative", width: 64, height: 64, borderRadius: "var(--admin-radius-sm)", overflow: "hidden", border: "1px solid var(--admin-border)" }}>
                        <Image src={form.image_url} alt="Category preview" fill style={{ objectFit: "cover" }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                        className="admin-btn admin-btn-outline"
                        style={{ padding: "6px 12px", fontSize: 12, color: "var(--admin-error)" }}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="cat-image-file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => document.getElementById("cat-image-file")?.click()}
                        className="admin-btn admin-btn-outline"
                        style={{ fontSize: 12, padding: "8px 16px" }}
                      >
                        <Upload size={14} style={{ marginRight: 6 }} />
                        {uploading ? "Uploading..." : "Upload Category Image"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-form-group" style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 22 }}>
                  <input
                    id="cat-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: "var(--admin-accent)" }}
                  />
                  <label htmlFor="cat-active" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Active (visible on storefront)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  <Save size={14} />{saving ? "Saving…" : editing ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Parent</th>
              <th>Sub-categories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 140 : 60 }} /></td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 48, color: "var(--admin-text-dim)" }}>
                  <Tag size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                  No categories yet. Create your first one.
                </td>
              </tr>
            ) : (
              categories.map((cat, i) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {cat.image_url && (
                        <div style={{ width: 36, height: 36, borderRadius: "var(--admin-radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--admin-bg-hover)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cat.image_url} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{cat.name}</p>
                        {cat.description && <p style={{ fontSize: 11, color: "var(--admin-text-dim)", margin: 0, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                    {cat.parent_id
                      ? categories.find((c) => c.id === cat.parent_id)?.name ?? "—"
                      : <span style={{ color: "var(--admin-text-dim)", fontStyle: "italic" }}>Top-level</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {(cat.children?.length ?? 0) > 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--admin-accent)", fontWeight: 600 }}>
                        <ChevronRight size={12} />{cat.children!.length}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 999, fontWeight: 700,
                      background: cat.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: cat.is_active ? "#16A34A" : "#EF4444",
                    }}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="admin-btn-ghost"
                        style={{ padding: "5px 10px" }}
                        onClick={() => openEdit(cat)}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        style={{
                          padding: "5px 10px", borderRadius: "var(--admin-radius-sm)",
                          background: deleteConfirm === cat.id ? "rgba(239,68,68,0.15)" : "transparent",
                          border: deleteConfirm === cat.id ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
                          cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                        }}
                        onClick={() => {
                          if (deleteConfirm === cat.id) handleDelete(cat.id);
                          else setDeleteConfirm(cat.id);
                        }}
                        onBlur={() => setTimeout(() => setDeleteConfirm(null), 200)}
                        title={deleteConfirm === cat.id ? "Click again to confirm" : "Delete"}
                      >
                        <Trash2 size={13} />
                        {deleteConfirm === cat.id && "Confirm"}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
