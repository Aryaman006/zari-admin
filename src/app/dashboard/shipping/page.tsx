"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Settings, Check, Package, ClipboardList, Eye, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { ShippingProvider, Order } from "@zari/shared-types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@zari/shared-utils";

const PROVIDER_LOGOS: Record<string, string> = {
  manual: "📦",
  shiprocket: "🚀",
  delhivery: "🚛",
  ekart: "📬",
};

export default function AdminShippingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"shipments" | "providers">("shipments");
  const [configProvider, setConfigProvider] = useState<ShippingProvider | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});

  const { data: providers = [], isLoading: providersLoading } = useQuery<ShippingProvider[]>({
    queryKey: ["admin", "shipping-providers"],
    queryFn: () => adminApi.listProviders().then((r) => r.data),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "orders-for-shipments"],
    queryFn: () => adminApi.listOrders({ page: 1, page_size: 100 }).then((r) => r.data),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => adminApi.activateProvider(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shipping-providers"] });
      toast.success("Provider activated!");
    },
    onError: () => toast.error("Failed to activate provider."),
  });

  const configureMut = useMutation({
    mutationFn: () => adminApi.configureProvider(configProvider!.id, configData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shipping-providers"] });
      toast.success("Provider configured!");
      setConfigProvider(null);
      setConfigData({});
    },
    onError: () => toast.error("Failed to configure provider."),
  });

  const CONFIG_FIELDS: Record<string, { label: string; placeholder: string; type?: string }[]> = {
    shiprocket: [
      { label: "Email", placeholder: "your@email.com" },
      { label: "Password", placeholder: "Shiprocket password", type: "password" },
    ],
    delhivery: [
      { label: "API Token", placeholder: "Delhivery API token" },
      { label: "Warehouse Pincode", placeholder: "400001" },
    ],
    ekart: [
      { label: "Client ID", placeholder: "Ekart client ID" },
      { label: "Client Secret", placeholder: "Ekart secret", type: "password" },
    ],
  };

  const orders = ordersData?.data || [];
  const trackedShipments = orders.filter((o: any) => o.shipment);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Shipping & Fulfillment</h1>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Manage active deliveries and courier service configurations</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--admin-border)", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("shipments")}
          className={`admin-btn ${activeTab === "shipments" ? "admin-btn-primary" : "admin-btn-ghost"}`}
          style={{ fontSize: 13, gap: 8 }}
        >
          <ClipboardList size={16} />
          Tracked Shipments ({trackedShipments.length})
        </button>
        <button
          onClick={() => setActiveTab("providers")}
          className={`admin-btn ${activeTab === "providers" ? "admin-btn-primary" : "admin-btn-ghost"}`}
          style={{ fontSize: 13, gap: 8 }}
        >
          <Truck size={16} />
          Logistics Providers ({providers.length})
        </button>
      </div>

      {activeTab === "shipments" ? (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Provider Info</th>
                <th>Tracking Number</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--admin-text-dim)" }}>Loading shipments…</td></tr>
              ) : trackedShipments.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--admin-text-dim)" }}>No active shipments found</td></tr>
              ) : (
                trackedShipments.map((order: any, i: number) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <code style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {order.user ? `${order.user.first_name} ${order.user.last_name}` : "Guest Customer"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                      {order.shipment.notes || "Manual Shipping"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{ fontSize: 12 }}>{order.shipment.tracking_number}</code>
                        {order.shipment.tracking_url && (
                          <a href={order.shipment.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-accent)" }}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info" style={{ textTransform: "capitalize" }}>
                        {order.shipment.status}
                      </span>
                    </td>
                    <td>
                      <a href={`/dashboard/orders/${order.id}`} className="admin-btn admin-btn-ghost" style={{ padding: 6 }}>
                        <Eye size={14} />
                      </a>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {providersLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--admin-radius-lg)" }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {providers.map((provider) => (
                <motion.div key={provider.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="admin-card" style={{ position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 28 }}>{PROVIDER_LOGOS[provider.slug] || "🚚"}</div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{provider.name}</h3>
                        <p style={{ fontSize: 11, color: "var(--admin-text-dim)", textTransform: "capitalize" }}>{provider.slug}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className={`admin-badge ${provider.is_active ? "admin-badge-success" : "admin-badge-error"}`}>
                        {provider.is_active ? "Active" : "Inactive"}
                      </span>
                      {provider.is_configured && (
                        <span className="admin-badge admin-badge-gold">Configured</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {!provider.is_active && (
                      <button onClick={() => activateMut.mutate(provider.id)} className="admin-btn admin-btn-primary" style={{ fontSize: 12, flex: 1 }}>
                        <Check size={14} /> Activate
                      </button>
                    )}
                    {provider.slug !== "manual" && (
                      <button onClick={() => { setConfigProvider(provider); setConfigData({}); }} className="admin-btn admin-btn-outline" style={{ fontSize: 12, flex: 1 }}>
                        <Settings size={14} /> Configure
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config modal */}
      <AnimatePresence>
        {configProvider && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfigProvider(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                zIndex: 101, width: "min(480px, 90vw)",
                background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)",
                borderRadius: "var(--admin-radius-lg)", padding: 32,
              }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Configure {configProvider.name}</h3>
              <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 24 }}>Enter your credentials to enable this provider</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {(CONFIG_FIELDS[configProvider.slug] || []).map((field) => (
                  <div key={field.label}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                      {field.label}
                    </label>
                    <input
                      className="admin-input"
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={configData[field.label] || ""}
                      onChange={(e) => setConfigData({ ...configData, [field.label]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button className="admin-btn admin-btn-outline" onClick={() => setConfigProvider(null)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={() => configureMut.mutate()} disabled={configureMut.isPending}>
                  {configureMut.isPending ? "Saving…" : "Save Configuration"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

