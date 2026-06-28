"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, FolderTree, Box, Users, Ticket, Truck,
  Settings, LogOut, ClipboardList,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { section: "Catalog" },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { label: "Inventory", href: "/dashboard/inventory", icon: Box },
  { section: "Sales" },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Coupons", href: "/dashboard/coupons", icon: Ticket },
  { section: "Admin" },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Shipping", href: "/dashboard/shipping", icon: Truck },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 700, fontSize: 22,
            background: "linear-gradient(135deg, #C9A84C, #D4B96A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Zari & Jasi
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--admin-text-dim)", marginTop: 2 }}>
            Admin Panel
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if ("section" in item && item.section) {
            return <div key={i} className="sidebar-section-title">{item.section}</div>;
          }
          const Icon = item.icon!;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href!));
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: "16px 16px 20px",
        borderTop: "1px solid var(--admin-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--admin-primary), var(--admin-accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p style={{ fontSize: 11, color: "var(--admin-text-dim)", textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-dim)", padding: 4 }}
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
