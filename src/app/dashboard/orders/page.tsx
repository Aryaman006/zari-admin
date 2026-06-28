"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, ChevronDown, FileText, Truck } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@zari/shared-utils";
import type { Order, PaginatedResponse, OrderStatus } from "@zari/shared-types";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STATUS_BADGE: Record<string, string> = {
  pending: "admin-badge-warning",
  confirmed: "admin-badge-info",
  processing: "admin-badge-info",
  shipped: "admin-badge-gold",
  delivered: "admin-badge-success",
  cancelled: "admin-badge-error",
  refunded: "admin-badge-error",
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled", "refunded",
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin", "orders", page, statusFilter, search],
    queryFn: () => adminApi.listOrders({
      page, page_size: 20,
      status: statusFilter || undefined,
      search: search || undefined,
    }).then((r) => r.data),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated.");
    },
    onError: () => toast.error("Failed to update order status."),
  });

  const generateInvoiceMut = useMutation({
    mutationFn: (id: string) => adminApi.generateInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Invoice generated.");
    },
    onError: () => toast.error("Failed to generate invoice."),
  });

  const orders = data?.data || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Orders</h1>
        <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{total} total orders</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
          <input className="admin-input" style={{ paddingLeft: 36 }} placeholder="Search ID, customer name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select
          className="admin-input"
          style={{ width: 180, cursor: "pointer" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 18 }} /></td></tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--admin-text-dim)" }}>No orders found</td></tr>
            ) : (
              orders.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, fontFamily: "monospace" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: 11, color: "var(--admin-text-dim)" }}>{formatDate(order.created_at)}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{order.user?.first_name} {order.user?.last_name}</p>
                      <p style={{ fontSize: 11, color: "var(--admin-text-dim)" }}>{order.user?.email}</p>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{order.items?.length || 0}</td>
                  <td style={{ fontWeight: 600, color: "var(--admin-accent)", fontSize: 14 }}>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`admin-badge ${order.payment_status === "paid" ? "admin-badge-success" : order.payment_status === "failed" ? "admin-badge-error" : "admin-badge-warning"}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatusMut.mutate({ id: order.id, status: e.target.value })}
                      className="admin-input"
                      style={{ fontSize: 12, padding: "4px 8px", width: "auto", minWidth: 100 }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/dashboard/orders/${order.id}`} className="admin-btn admin-btn-ghost" style={{ padding: 5 }} aria-label="View">
                        <Eye size={14} />
                      </a>
                      {!order.invoice && order.payment_status === "paid" && (
                        <button onClick={() => generateInvoiceMut.mutate(order.id)}
                          className="admin-btn admin-btn-ghost" style={{ padding: 5 }} aria-label="Invoice">
                          <FileText size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`admin-btn ${p === page ? "admin-btn-primary" : "admin-btn-outline"}`} style={{ width: 36, height: 36, padding: 0 }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
