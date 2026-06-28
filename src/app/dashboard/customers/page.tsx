"use client";

import { useEffect, useState } from "react";
import { User, Search, ChevronRight, ShoppingBag, DollarSign } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@zari/shared-utils";
import type { User as UserType } from "@zari/shared-types";
import { motion } from "framer-motion";

interface CustomerData extends UserType {
  total_orders?: number;
  total_spent?: number;
}

interface CustomerDetail extends CustomerData {
  orders?: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => { loadCustomers(); }, [page, search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listCustomers({ page, page_size: PAGE_SIZE, search: search || undefined });
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openCustomer = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await adminApi.getCustomer(id);
      setSelected(data);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customers</h1>
          <p className="admin-page-subtitle">{total.toLocaleString()} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
            <input
              className="admin-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            />
          </div>
          <button
            className="admin-btn-primary"
            onClick={() => { setSearch(searchInput); setPage(1); }}
          >
            Search
          </button>
          {search && (
            <button
              className="admin-btn-ghost"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 20 }}>
        {/* Customers Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 160 : 60 }} /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--admin-text-dim)" }}>
                    <User size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => openCustomer(c.id)}
                    style={{ cursor: "pointer", background: selected?.id === c.id ? "rgba(99,102,241,0.05)" : undefined }}
                    className="admin-table-row-hover"
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "var(--admin-bg-hover)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "var(--admin-accent)",
                          flexShrink: 0,
                        }}>
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{c.first_name} {c.last_name}</p>
                          <p style={{ fontSize: 11, color: "var(--admin-text-dim)", margin: 0 }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{formatDate(c.created_at)}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        <ShoppingBag size={12} />
                        {(c as any).total_orders ?? "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>
                      {(c as any).total_spent ? formatCurrency((c as any).total_spent) : "—"}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 999, fontWeight: 700,
                        background: c.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: c.is_active ? "#16A34A" : "#DC2626",
                      }}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                      {!c.is_verified && (
                        <span style={{
                          marginLeft: 4, fontSize: 11, padding: "3px 8px", borderRadius: 999,
                          background: "rgba(245,158,11,0.1)", color: "#D97706", fontWeight: 700,
                        }}>
                          Unverified
                        </span>
                      )}
                    </td>
                    <td>
                      <ChevronRight size={14} style={{ color: "var(--admin-text-dim)" }} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 16 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={p === page ? "admin-btn-primary" : "admin-btn-ghost"}
                  style={{ width: 32, height: 32, padding: 0, fontSize: 12 }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Detail Panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
            style={{ padding: "24px 20px", position: "sticky", top: 80, height: "fit-content" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Customer Details</h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-dim)", fontSize: 18, lineHeight: 1 }}
              >×</button>
            </div>

            {detailLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[80, 60, 60, 40].map((w, i) => <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />)}
              </div>
            ) : (
              <>
                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--admin-border)" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "var(--admin-bg-hover)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "var(--admin-accent)", flexShrink: 0,
                  }}>
                    {selected.first_name[0]}{selected.last_name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 15 }}>{selected.first_name} {selected.last_name}</p>
                    <p style={{ fontSize: 12, color: "var(--admin-text-dim)", margin: 0 }}>{selected.email}</p>
                    {selected.phone && <p style={{ fontSize: 12, color: "var(--admin-text-dim)", margin: "2px 0 0" }}>{selected.phone}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: <ShoppingBag size={14} />, label: "Orders", value: (selected as any).total_orders ?? "—" },
                    { icon: <DollarSign size={14} />, label: "Spent", value: (selected as any).total_spent ? formatCurrency((selected as any).total_spent) : "—" },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ padding: "12px 14px", background: "var(--admin-bg-hover)", borderRadius: "var(--admin-radius-sm)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--admin-text-dim)", marginBottom: 4, fontSize: 11 }}>
                        {icon}{label}
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  {[
                    { label: "Role", value: selected.role },
                    { label: "Verified", value: selected.is_verified ? "✓ Yes" : "✗ No" },
                    { label: "Status", value: selected.is_active ? "Active" : "Inactive" },
                    { label: "Joined", value: formatDate(selected.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--admin-text-dim)" }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                {(selected.orders ?? []).length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--admin-border)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Recent Orders</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(selected.orders ?? []).slice(0, 5).map((o: any) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "6px 0", borderBottom: "1px solid var(--admin-border)" }}>
                          <span style={{ color: "var(--admin-text-dim)" }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(o.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
