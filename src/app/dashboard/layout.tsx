"use client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  // Wait for Zustand persist to hydrate from localStorage before checking auth
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, user]);

  // Show nothing while checking — avoids flash of redirect
  if (!hydrated || !user) return null;

  return (
    <div>
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
              <input className="admin-input" placeholder="Search anything…" style={{ paddingLeft: 36, background: "var(--admin-bg-card)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              width: 36, height: 36, borderRadius: "var(--admin-radius-sm)",
              background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--admin-text-muted)",
            }}>
              <Bell size={16} />
            </button>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
