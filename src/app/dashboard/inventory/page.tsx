"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, AlertTriangle, Edit2, Check } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@zari/shared-utils";
import { toast } from "sonner";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory", search, filter],
    queryFn: () => adminApi.getInventory({
      search: search || undefined,
      low_stock: filter === "low" ? true : undefined,
      out_of_stock: filter === "out" ? true : undefined,
    }).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ variantId, qty }: { variantId: string; qty: number }) =>
      adminApi.updateStock(variantId, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success("Stock updated.");
      setEditId(null);
    },
    onError: () => toast.error("Failed to update stock."),
  });

  const items = data?.data || [];
  const stats = data?.stats || { total: 0, low_stock: 0, out_of_stock: 0 };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Inventory</h1>
        <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Manage product stock levels</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Variants", value: stats.total, color: "var(--admin-accent)" },
          { label: "Low Stock (< 10)", value: stats.low_stock, color: "var(--admin-warning)" },
          { label: "Out of Stock", value: stats.out_of_stock, color: "var(--admin-error)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
          <input className="admin-input" style={{ paddingLeft: 36 }} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["all", "All"], ["low", "Low Stock"], ["out", "Out of Stock"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val as any)}
              className={`admin-btn ${filter === val ? "admin-btn-primary" : "admin-btn-outline"}`}
              style={{ fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>SKU</th>
              <th>Price</th>
              <th style={{ width: 140 }}>Stock Level</th>
              <th style={{ width: 120 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--admin-text-dim)" }}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--admin-text-dim)" }}>No variants found</td></tr>
            ) : items.map((item: any) => (
              <tr key={item.variant_id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 46, borderRadius: "var(--admin-radius-sm)", overflow: "hidden", background: "var(--admin-bg-hover)", flexShrink: 0 }}>
                      {item.primary_image ? (
                        <Image src={item.primary_image} alt={item.product_name} width={36} height={46} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingBag size={14} color="var(--admin-text-dim)" /></div>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.product_name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.color_hex && (
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: item.color_hex,
                          border: "1px solid rgba(255,255,255,0.25)"
                        }}
                      />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--admin-text)" }}>
                      {item.color || "Default"} / {item.size || "Free Size"}
                    </span>
                  </div>
                </td>
                <td><code style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{item.sku}</code></td>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(item.price_override || item.base_price)}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      disabled={item.stock_qty <= 0}
                      onClick={() => updateMut.mutate({ variantId: item.variant_id, qty: item.stock_qty - 1 })}
                      className="admin-btn admin-btn-outline"
                      style={{ padding: 0, width: 24, height: 24, minWidth: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}
                    >
                      -
                    </button>
                    
                    <span style={{
                      display: "inline-block", minWidth: 32, textAlign: "center", fontWeight: 700, fontSize: 13,
                      color: "var(--admin-text)"
                    }}>
                      {item.stock_qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateMut.mutate({ variantId: item.variant_id, qty: item.stock_qty + 1 })}
                      className="admin-btn admin-btn-outline"
                      style={{ padding: 0, width: 24, height: 24, minWidth: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  <span className={`admin-badge ${item.stock_qty === 0 ? "admin-badge-error" : item.stock_qty < 10 ? "admin-badge-warning" : "admin-badge-success"}`}>
                    {item.stock_qty === 0 ? "Out of Stock" : item.stock_qty < 10 ? "Low Stock" : "In Stock"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
