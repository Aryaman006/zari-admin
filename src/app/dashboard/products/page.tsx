"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, ShoppingBag, MoreVertical } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency, relativeTime } from "@zari/shared-utils";
import type { Product, PaginatedResponse } from "@zari/shared-types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin", "products", page, search],
    queryFn: () => adminApi.listProducts({ page, page_size: 20, search: search || undefined }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product deleted.");
    },
    onError: () => toast.error("Failed to delete product."),
  });

  const products = data?.data || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Products</h1>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{total} products in catalog</p>
        </div>
        <Link href="/dashboard/products/new" className="admin-btn admin-btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24, position: "relative", maxWidth: 400 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
        <input
          className="admin-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}><div className="skeleton" style={{ height: 20, width: "100%" }} /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--admin-text-dim)" }}>
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product, i) => {
                const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_qty, 0) || 0;
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 44, height: 56, borderRadius: "var(--admin-radius-sm)",
                          overflow: "hidden", background: "var(--admin-bg-hover)", flexShrink: 0,
                        }}>
                          {product.primary_image ? (
                            <Image src={product.primary_image} alt={product.name} width={44} height={56} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ShoppingBag size={16} color="var(--admin-text-dim)" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</p>
                          <p style={{ fontSize: 11, color: "var(--admin-text-dim)" }}>
                            {product.variants?.length || 0} variants · {relativeTime(product.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                        {product.category?.name || "—"}
                      </span>
                    </td>
                    <td>
                      <div>
                        {product.sale_price && product.sale_price < product.base_price ? (
                          <>
                            <span style={{ fontWeight: 600, color: "var(--admin-accent)" }}>{formatCurrency(product.sale_price)}</span>
                            <br />
                            <span style={{ fontSize: 11, color: "var(--admin-text-dim)", textDecoration: "line-through" }}>{formatCurrency(product.base_price)}</span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{formatCurrency(product.base_price)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${totalStock === 0 ? "admin-badge-error" : totalStock < 10 ? "admin-badge-warning" : "admin-badge-success"}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${product.is_active ? "admin-badge-success" : "admin-badge-error"}`}>
                        {product.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={`/dashboard/products/${product.id}`}
                          className="admin-btn admin-btn-ghost" style={{ padding: 6 }} aria-label="Edit">
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Delete this product?")) deleteMutation.mutate(product.id);
                          }}
                          className="admin-btn admin-btn-ghost" style={{ padding: 6, color: "var(--admin-error)" }}
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`admin-btn ${p === page ? "admin-btn-primary" : "admin-btn-outline"}`}
              style={{ width: 36, height: 36, padding: 0 }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
