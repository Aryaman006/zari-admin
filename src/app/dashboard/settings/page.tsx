"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, CreditCard, Mail, Landmark, Save, ShieldAlert, ArrowRight } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type TabType = "store" | "payment" | "email" | "tax";

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("store");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  });

  const [form, setForm] = useState({
    store_name: "",
    store_email: "",
    store_phone: "",
    store_address: "",
    razorpay_key_id: "",
    razorpay_key_secret: "",
    razorpay_webhook_secret: "",
    resend_api_key: "",
    resend_from_email: "",
    currency: "INR",
    cgst_rate: 0.09,
    sgst_rate: 0.09,
  });

  // Populate form on load
  useQuery({
    queryKey: ["admin", "settings-populate"],
    queryFn: () =>
      adminApi.getSettings().then((r) => {
        setForm(r.data);
        return r.data;
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to update settings.");
    },
  });

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 80, color: "var(--admin-text-dim)" }}>Loading store settings...</div>;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "store", label: "Store Details", icon: Store },
    { id: "payment", label: "Payments (Razorpay)", icon: CreditCard },
    { id: "email", label: "Email Setup (Resend)", icon: Mail },
    { id: "tax", label: "Taxes & Local", icon: Landmark },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Configure store defaults, API integrations, and legal requirements</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-btn ${active ? "admin-btn-primary" : "admin-btn-ghost"}`}
                style={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  padding: "10px 16px",
                  fontSize: 13,
                  gap: 10,
                  width: "100%",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
          
          <div style={{
            marginTop: 24,
            padding: 16,
            background: "rgba(201,168,76,0.06)",
            border: "1px dashed rgba(201,168,76,0.2)",
            borderRadius: "var(--admin-radius)",
            fontSize: 11,
            color: "var(--admin-text-muted)",
          }}>
            <ShieldAlert size={14} color="var(--admin-accent)" style={{ marginBottom: 6 }} />
            Settings mutations are applied in-memory dynamically and stored securely in localized config files.
          </div>
        </div>

        {/* Form Content */}
        <div className="admin-card" style={{ padding: 28 }}>
          <form onSubmit={handleSave}>
            {activeTab === "store" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>Store Identity</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="admin-form-label">Business Name *</label>
                    <input
                      className="admin-input"
                      value={form.store_name}
                      onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label className="admin-form-label">Support Email *</label>
                      <input
                        type="email"
                        className="admin-input"
                        value={form.store_email}
                        onChange={(e) => setForm({ ...form, store_email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-form-label">Support Phone *</label>
                      <input
                        className="admin-input"
                        value={form.store_phone}
                        onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="admin-form-label">Storefront Address</label>
                    <textarea
                      className="admin-input"
                      rows={3}
                      value={form.store_address}
                      onChange={(e) => setForm({ ...form, store_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>Razorpay Integration</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="admin-form-label">Razorpay Key ID</label>
                    <input
                      className="admin-input"
                      value={form.razorpay_key_id}
                      onChange={(e) => setForm({ ...form, razorpay_key_id: e.target.value })}
                      placeholder="rzp_live_..."
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Razorpay Key Secret</label>
                    <input
                      type="password"
                      className="admin-input"
                      value={form.razorpay_key_secret}
                      onChange={(e) => setForm({ ...form, razorpay_key_secret: e.target.value })}
                      placeholder="••••••••••••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Webhook Secret</label>
                    <input
                      type="password"
                      className="admin-input"
                      value={form.razorpay_webhook_secret}
                      onChange={(e) => setForm({ ...form, razorpay_webhook_secret: e.target.value })}
                      placeholder="webhook_secret_..."
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Store Currency</label>
                    <select
                      className="admin-input"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>Transactional Emails</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="admin-form-label">Resend API Key</label>
                    <input
                      type="password"
                      className="admin-input"
                      value={form.resend_api_key}
                      onChange={(e) => setForm({ ...form, resend_api_key: e.target.value })}
                      placeholder="re_..."
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Sender Email Address (From)</label>
                    <input
                      type="email"
                      className="admin-input"
                      value={form.resend_from_email}
                      onChange={(e) => setForm({ ...form, resend_from_email: e.target.value })}
                      placeholder="no-reply@yourdomain.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tax" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>Tax & GST Configuration</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="admin-form-label">CGST Rate (fraction) *</label>
                    <input
                      type="number"
                      step="0.001"
                      className="admin-input"
                      value={form.cgst_rate}
                      onChange={(e) => setForm({ ...form, cgst_rate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <p style={{ fontSize: 10, color: "var(--admin-text-muted)", marginTop: 4 }}>e.g. 0.09 for 9% CGST</p>
                  </div>
                  <div>
                    <label className="admin-form-label">SGST Rate (fraction) *</label>
                    <input
                      type="number"
                      step="0.001"
                      className="admin-input"
                      value={form.sgst_rate}
                      onChange={(e) => setForm({ ...form, sgst_rate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <p style={{ fontSize: 10, color: "var(--admin-text-muted)", marginTop: 4 }}>e.g. 0.09 for 9% SGST</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--admin-border)" }}>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="admin-btn admin-btn-primary"
                style={{ gap: 8 }}
              >
                <Save size={14} />
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
