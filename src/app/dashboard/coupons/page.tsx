"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Edit2, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@zari/shared-utils";
import type { Coupon } from "@zari/shared-types";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DEFAULT_FORM = {
  code: "",
  type: "percent" as "percent" | "flat",
  value: 10,
  min_order_amount: 0,
  max_discount: undefined as number | undefined,
  usage_limit: undefined as number | undefined,
  expires_at: "",
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: () => adminApi.listCoupons().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        min_order_amount: form.min_order_amount || null,
        max_discount: form.max_discount || null,
        usage_limit: form.usage_limit || null,
        expires_at: form.expires_at || null,
      };

      if (editingCoupon) {
        return adminApi.updateCoupon(editingCoupon.id, payload);
      } else {
        return adminApi.createCoupon(payload as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success(editingCoupon ? "Coupon updated!" : "Coupon created!");
      setShowForm(false);
      setEditingCoupon(null);
      setForm(DEFAULT_FORM);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to save coupon.");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => adminApi.toggleCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon status toggled.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon deleted.");
    },
  });

  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type as "percent" | "flat",
      value: coupon.value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount || undefined,
      usage_limit: coupon.usage_limit || undefined,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Coupons</h1>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{coupons.length} coupons configured</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setForm(DEFAULT_FORM);
            setShowForm(!showForm);
          }}
          className="admin-btn admin-btn-primary"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="admin-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCoupon(null);
                setForm(DEFAULT_FORM);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label className="admin-form-label">Code *</label>
              <input
                className="admin-input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE20"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className="admin-form-label">Discount Type *</label>
              <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="admin-form-label">Discount Value *</label>
              <input className="admin-input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} min="0" />
            </div>
            <div>
              <label className="admin-form-label">Min Purchase (₹)</label>
              <input className="admin-input" type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} min="0" />
            </div>
            {form.type === "percent" && (
              <div>
                <label className="admin-form-label">Max Discount (₹)</label>
                <input className="admin-input" type="number" value={form.max_discount || ""} onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : undefined })} min="0" placeholder="No limit" />
              </div>
            )}
            <div>
              <label className="admin-form-label">Usage Limit</label>
              <input className="admin-input" type="number" value={form.usage_limit || ""} onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? Number(e.target.value) : undefined })} min="1" placeholder="Unlimited" />
            </div>
            <div>
              <label className="admin-form-label">Expires At</label>
              <input className="admin-input" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => {
                setShowForm(false);
                setEditingCoupon(null);
                setForm(DEFAULT_FORM);
              }}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => saveMutation.mutate()}
              disabled={!form.code || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editingCoupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type & Value</th>
              <th>Min Order</th>
              <th>Usage Status</th>
              <th>Expires</th>
              <th>Status</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--admin-text-dim)" }}>Loading…</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--admin-text-dim)" }}>No coupons configured yet</td></tr>
            ) : coupons.map((coupon, i) => (
              <motion.tr key={coupon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag size={14} color="var(--admin-accent)" />
                    <code style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: "var(--admin-accent)" }}>{coupon.code}</code>
                  </div>
                </td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>
                  {coupon.type === "percent" ? `${coupon.value}% off` : `₹${coupon.value} flat`}
                  {coupon.max_discount && <span style={{ fontSize: 11, color: "var(--admin-text-dim)" }}> (max ₹{coupon.max_discount})</span>}
                </td>
                <td style={{ fontSize: 13 }}>{coupon.min_order_amount ? formatCurrency(coupon.min_order_amount) : "—"}</td>
                <td style={{ fontSize: 13 }}>
                  {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : " (Unlimited)"}
                </td>
                <td style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                  {coupon.expires_at ? formatDate(coupon.expires_at) : "Never"}
                </td>
                <td>
                  <span className={`admin-badge ${coupon.is_active ? "admin-badge-success" : "admin-badge-error"}`}>
                    {coupon.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => startEdit(coupon)}
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: 6 }}
                      title="Edit Coupon"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => toggleMut.mutate(coupon.id)} className="admin-btn admin-btn-ghost" style={{ padding: 6 }}
                      title={coupon.is_active ? "Deactivate" : "Activate"}>
                      {coupon.is_active ? <ToggleRight size={18} color="var(--admin-success)" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => { if (confirm("Delete coupon?")) deleteMut.mutate(coupon.id); }}
                      className="admin-btn admin-btn-ghost" style={{ padding: 6, color: "var(--admin-error)" }}
                      title="Delete Coupon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

