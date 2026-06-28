"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Users, AlertTriangle,
  ArrowUpRight, ClipboardList, FolderTree, ArrowRight, Eye, Edit2, Check
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@zari/shared-utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STATUS_BADGE: Record<string, string> = {
  pending: "admin-badge-warning",
  confirmed: "admin-badge-info",
  processing: "admin-badge-info",
  shipped: "admin-badge-gold",
  delivered: "admin-badge-success",
  cancelled: "admin-badge-error",
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin", "revenue-chart"],
    queryFn: () => adminApi.getRevenueChart().then((r) => r.data),
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: () => adminApi.listOrders({ page: 1, page_size: 5 }).then((r) => r.data),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["admin", "low-stock"],
    queryFn: () => adminApi.getInventory({ low_stock: true, limit: 5 }).then((r) => r.data),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["admin", "top-products"],
    queryFn: () => adminApi.getTopProducts().then((r) => r.data),
  });

  const restockMutation = useMutation({
    mutationFn: ({ variantId, qty }: { variantId: string; qty: number }) =>
      adminApi.updateStock(variantId, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "low-stock"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Stock updated!");
      setRestockId(null);
    },
    onError: () => toast.error("Failed to update stock."),
  });

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.total_revenue) : "₹0.00",
      growth: stats?.revenue_growth ?? 0,
      icon: IndianRupee,
      className: "revenue",
    },
    {
      label: "Total Orders",
      value: stats?.total_orders?.toLocaleString("en-IN") ?? "0",
      growth: stats?.orders_growth ?? 0,
      icon: ClipboardList,
      className: "orders",
    },
    {
      label: "Total Customers",
      value: stats?.total_customers?.toLocaleString("en-IN") ?? "0",
      growth: stats?.customers_growth ?? 0,
      icon: Users,
      className: "customers",
    },
    {
      label: "Active Products",
      value: stats?.total_products?.toLocaleString("en-IN") ?? "0",
      growth: 0,
      icon: ShoppingBag,
      className: "products",
    },
  ];

  const recentOrders = recentOrdersData?.data || [];
  const lowStockItems = lowStockData?.data || [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "var(--admin-text-muted)", fontSize: 14 }}>Welcome to Zari & Jasi Admin. Here's your business performance summary.</p>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`stat-card ${card.className}`}
              style={{
                background: "var(--admin-bg-card)",
                border: "1px solid var(--admin-border)",
                borderRadius: "var(--admin-radius-lg)",
                padding: 24,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--admin-radius)",
                  background: "var(--admin-bg-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color="var(--admin-accent)" />
                </div>
                {card.growth !== 0 && (
                  <span className={`stat-growth ${card.growth >= 0 ? "positive" : "negative"}`}>
                    {card.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(card.growth)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--admin-text)", marginBottom: 4 }}>
                {statsLoading ? "—" : card.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--admin-text-muted)", fontWeight: 500 }}>{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Layout: Revenue Chart + Recent Orders, Top Selling + Low Stock */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Revenue Chart */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Revenue Overview</h3>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)", margin: "4px 0 0" }}>Daily sales figures for the last 30 days</p>
              </div>
            </div>

            <div style={{ height: 320 }}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      stroke="rgba(255,255,255,0.15)"
                      tick={{ fontSize: 10, fill: "var(--admin-text-muted)" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                      stroke="rgba(255,255,255,0.15)"
                      tick={{ fontSize: 10, fill: "var(--admin-text-muted)" }}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "var(--admin-text-muted)", fontWeight: 600 }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--admin-text-dim)", fontSize: 13 }}>
                  No revenue data yet
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 24, borderBottom: "1px solid var(--admin-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Orders</h3>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)", margin: "4px 0 0" }}>Check status of latest purchases</p>
              </div>
              <a href="/dashboard/orders" className="admin-btn admin-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
                View All <ArrowRight size={14} />
              </a>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--admin-text-dim)", fontSize: 13 }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div style={{ fontSize: 10, color: "var(--admin-text-dim)", marginTop: 2 }}>{formatDate(o.created_at)}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {o.user ? `${o.user.first_name} ${o.user.last_name}` : "Guest Customer"}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--admin-accent)", fontSize: 13 }}>
                        {formatCurrency(o.total)}
                      </td>
                      <td>
                        <span className={`admin-badge ${STATUS_BADGE[o.status] || "admin-badge-info"}`}>
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td>
                        <a href={`/dashboard/orders/${o.id}`} className="admin-btn admin-btn-ghost" style={{ padding: 6 }}>
                          <Eye size={14} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Selling Products */}
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--admin-border)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Top Products</h3>
              <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "4px 0 0" }}>High performers by sales volume</p>
            </div>
            <div style={{ padding: "8px 16px" }}>
              {topProducts.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--admin-text-dim)", fontSize: 12 }}>
                  No sales data yet
                </div>
              ) : (
                topProducts.map((p: any, index: number) => (
                  <div key={p.variant_id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: index === topProducts.length - 1 ? "none" : "1px solid var(--admin-border)" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: index === 0 ? "rgba(201,168,76,0.2)" : "var(--admin-bg-hover)",
                      color: index === 0 ? "var(--admin-accent)" : "var(--admin-text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 12, flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.product_name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--admin-text-dim)" }}>
                        {p.color} / {p.size} ({p.sku})
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>{p.total_sold} sold</span>
                      <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: "var(--admin-accent)" }}>{formatCurrency(p.total_revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--admin-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Low Stock Alerts</h3>
                <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "4px 0 0" }}>Items running low on inventory</p>
              </div>
              <AlertTriangle size={16} color="var(--admin-warning)" />
            </div>
            <div style={{ padding: 16 }}>
              {lowStockItems.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--admin-success)", fontSize: 12, fontWeight: 600 }}>
                  ✓ All stock levels optimal
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {lowStockItems.map((item: any) => (
                    <div key={item.variant_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--admin-bg-hover)", borderRadius: "var(--admin-radius-sm)" }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.product_name}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--admin-text-dim)" }}>
                          {item.color} / {item.size} ({item.sku})
                        </p>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          background: item.stock_qty === 0 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                          color: item.stock_qty === 0 ? "var(--admin-error)" : "var(--admin-warning)"
                        }}>
                          Qty: {item.stock_qty}
                        </span>

                        {restockId === item.variant_id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <input
                              type="number"
                              className="admin-input"
                              style={{ width: 44, padding: "2px 4px", fontSize: 11, height: 24, textAlign: "center" }}
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              autoFocus
                            />
                            <button
                              onClick={() => restockMutation.mutate({ variantId: item.variant_id, qty: Number(restockQty) })}
                              className="admin-btn admin-btn-primary"
                              style={{ padding: 4, height: 24, minWidth: 24 }}
                            >
                              <Check size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setRestockId(item.variant_id); setRestockQty(String(item.stock_qty + 10)); }}
                            className="admin-btn admin-btn-outline"
                            style={{ padding: "4px 8px", fontSize: 10, height: 24 }}
                          >
                            Restock
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
