"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, FileText, CheckCircle2, XCircle, Clock, User, MapPin, Phone, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@zari/shared-utils";
import type { Order, OrderItem, Address, OrderStatus } from "@zari/shared-types";
import { toast } from "sonner";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["admin", "order", params.id],
    queryFn: () => adminApi.getOrder(params.id as string).then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => adminApi.updateOrderStatus(params.id as string, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update status."),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => adminApi.generateInvoice(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", params.id] });
      toast.success("Invoice generated!");
    },
    onError: () => toast.error("Failed to generate invoice."),
  });

  const createShipmentMutation = useMutation({
    mutationFn: (data: { tracking_number: string; tracking_url?: string; notes?: string }) =>
      adminApi.createShipment(params.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", params.id] });
      toast.success("Shipment created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create shipment. Make sure a shipping provider is activated in Logistics Settings.");
    },
  });

  const updateShipmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateShipment(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", params.id] });
      toast.success("Shipment status updated!");
    },
    onError: () => {
      toast.error("Failed to update shipment status.");
    },
  });

  const statusColors: Record<string, string> = {
    pending: "var(--admin-warning)",
    confirmed: "var(--admin-accent)",
    processing: "var(--admin-accent)",
    shipped: "var(--admin-accent)",
    out_for_delivery: "var(--admin-accent)",
    delivered: "var(--admin-success)",
    cancelled: "var(--admin-error)",
    refunded: "var(--admin-error)",
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 80, color: "var(--admin-text-dim)" }}>Loading order...</div>;
  }

  if (!order) {
    return <div style={{ textAlign: "center", padding: 80, color: "var(--admin-text-dim)" }}>Order not found</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={() => router.back()} className="admin-btn admin-btn-ghost" style={{ padding: "8px 12px" }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p style={{ color: "var(--admin-text-dim)", fontSize: 13 }}>
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="admin-card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {order.status === "delivered" ? (
              <CheckCircle2 size={24} color="var(--admin-success)" />
            ) : order.status === "cancelled" ? (
              <XCircle size={24} color="var(--admin-error)" />
            ) : (
              <Clock size={24} color="var(--admin-warning)" />
            )}
            <div>
              <p style={{ fontWeight: 700, color: statusColors[order.status] }}>
                {getOrderStatusLabel(order.status)}
              </p>
              <p style={{ fontSize: 12, color: "var(--admin-text-dim)" }}>
                Payment: {order.payment_status}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            className="admin-input"
            value={order.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value as OrderStatus)}
            disabled={updateStatusMutation.isPending}
            style={{ minWidth: 180 }}
          >
            {["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"].map(
              (status) => (
                <option key={status} value={status}>{getOrderStatusLabel(status as OrderStatus)}</option>
              )
            )}
          </select>

          {order.payment_status === "paid" && !order.invoice && (
            <button
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={generateInvoiceMutation.isPending}
              className="admin-btn admin-btn-primary"
            >
              <FileText size={16} /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Order Items */}
        <div className="admin-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order Items</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {order.items?.map((item: OrderItem) => (
              <div key={item.id} style={{ display: "flex", gap: 16, paddingBottom: 16, borderBottom: "1px solid var(--admin-border)" }}>
                <div style={{
                  width: 80, height: 100, borderRadius: "var(--admin-radius-md)", overflow: "hidden",
                  background: "var(--admin-bg-hover)", flexShrink: 0,
                }}>
                  {item.product_snapshot.image_url && (
                    <Image
                      src={item.product_snapshot.image_url}
                      alt={item.product_snapshot.product_name}
                      width={80}
                      height={100}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {item.product_snapshot.product_name}
                  </p>
                  {item.product_snapshot.size && (
                    <p style={{ fontSize: 12, color: "var(--admin-text-dim)", marginBottom: 4 }}>
                      Size: {item.product_snapshot.size}
                    </p>
                  )}
                  {item.product_snapshot.color && (
                    <p style={{ fontSize: 12, color: "var(--admin-text-dim)", marginBottom: 4 }}>
                      Color: {item.product_snapshot.color}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--admin-text-dim)" }}>
                    SKU: {item.product_snapshot.sku} | Qty: {item.quantity}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, color: "var(--admin-accent)" }}>
                    {formatCurrency(item.total_price)}
                  </p>
                  {item.total_price !== item.unit_price * item.quantity && (
                    <p style={{ fontSize: 12, color: "var(--admin-text-dim)", textDecoration: "line-through" }}>
                      {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--admin-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--admin-text-dim)" }}>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--admin-success)" }}>Discount</span>
                <span style={{ color: "var(--admin-success)" }}>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--admin-text-dim)" }}>Shipping</span>
              <span>{order.shipping_charge > 0 ? formatCurrency(order.shipping_charge) : "Free"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--admin-text-dim)" }}>Tax</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", marginTop: 12,
              paddingTop: 12, borderTop: "1px solid var(--admin-border)",
            }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "var(--admin-accent)" }}>
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer Info */}
          <div className="admin-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} /> Customer
            </h3>
            {order.user && (
              <>
                <p style={{ fontWeight: 600 }}>
                  {order.user.first_name} {order.user.last_name}
                </p>
                <p style={{ fontSize: 13, color: "var(--admin-text-dim)", marginTop: 4 }}>
                  {order.user.email}
                </p>
                {order.user.phone && (
                  <p style={{ fontSize: 13, color: "var(--admin-text-dim)", marginTop: 4 }}>
                    {order.user.phone}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="admin-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={16} /> Shipping Address
              </h3>
              <div style={{ fontSize: 13, color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>
                <p style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                  {order.address.name}
                </p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
                <p style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone size={14} /> {order.address.phone}
                </p>
              </div>
            </div>
          )}

          {/* Shipment Management / Tracking Flow */}
          <div className="admin-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={16} /> Fulfillment & Shipping
            </h3>
            
            {order.shipment ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ padding: 12, background: "var(--admin-bg-hover)", borderRadius: "var(--admin-radius-sm)", marginBottom: 16 }}>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Tracking #:</strong> <code style={{ fontSize: 12 }}>{order.shipment.tracking_number || "Manual Delivery"}</code>
                  </p>
                  {order.shipment.tracking_url && (
                    <p style={{ margin: "0 0 6px" }}>
                      <a href={order.shipment.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-accent)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Track Package <ExternalLink size={12} />
                      </a>
                    </p>
                  )}
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Shipment Status:</strong>{" "}
                    <span className="admin-badge admin-badge-info" style={{ textTransform: "capitalize" }}>
                      {order.shipment.status}
                    </span>
                  </p>
                  {order.shipment.notes && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--admin-text-muted)" }}>
                      <strong>Courier Info:</strong> {order.shipment.notes}
                    </p>
                  )}
                </div>

                <label className="admin-form-label" style={{ fontSize: 11 }}>Update Shipment Status</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => updateShipmentMutation.mutate({ id: order.shipment!.id, status: "in_transit" })}
                    disabled={updateShipmentMutation.isPending || order.shipment.status === "in_transit"}
                    className="admin-btn admin-btn-outline"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    Mark as In Transit
                  </button>
                  <button
                    onClick={() => updateShipmentMutation.mutate({ id: order.shipment!.id, status: "delivered" })}
                    disabled={updateShipmentMutation.isPending || order.shipment.status === "delivered"}
                    className="admin-btn admin-btn-outline"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    Mark as Delivered
                  </button>
                  <button
                    onClick={() => updateShipmentMutation.mutate({ id: order.shipment!.id, status: "cancelled" })}
                    disabled={updateShipmentMutation.isPending || order.shipment.status === "cancelled"}
                    className="admin-btn admin-btn-outline"
                    style={{ fontSize: 12, padding: "6px 12px", color: "var(--admin-error)" }}
                  >
                    Cancel Shipment
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginBottom: 12 }}>
                  No active shipment booked. Create a manual shipment to log courier details.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: 11 }}>Courier Name</label>
                    <select
                      id="ship-courier"
                      className="admin-input"
                      style={{ fontSize: 12 }}
                      defaultValue="Delhivery"
                    >
                      <option value="Delhivery">Delhivery</option>
                      <option value="DTDC">DTDC</option>
                      <option value="Ekart">Ekart Logistics</option>
                      <option value="India Post">India Post</option>
                      <option value="Custom Courier">Custom / Local Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: 11 }}>Tracking Number</label>
                    <input
                      id="ship-tracking-number"
                      className="admin-input"
                      style={{ fontSize: 12 }}
                      placeholder="e.g. 1284719273"
                    />
                  </div>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: 11 }}>Tracking URL (Optional)</label>
                    <input
                      id="ship-tracking-url"
                      className="admin-input"
                      style={{ fontSize: 12 }}
                      placeholder="https://track..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const courier = (document.getElementById("ship-courier") as HTMLSelectElement)?.value || "Delhivery";
                      const trackNum = (document.getElementById("ship-tracking-number") as HTMLInputElement)?.value || "";
                      const trackUrl = (document.getElementById("ship-tracking-url") as HTMLInputElement)?.value || "";
                      
                      if (!trackNum) {
                        toast.error("Tracking number is required.");
                        return;
                      }

                      createShipmentMutation.mutate({
                        tracking_number: trackNum,
                        tracking_url: trackUrl || undefined,
                        notes: `Courier: ${courier}`,
                      });
                    }}
                    disabled={createShipmentMutation.isPending}
                    className="admin-btn admin-btn-primary"
                    style={{ fontSize: 12, padding: "8px 12px", marginTop: 4 }}
                  >
                    {createShipmentMutation.isPending ? "Booking…" : "Log Shipment Details"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
