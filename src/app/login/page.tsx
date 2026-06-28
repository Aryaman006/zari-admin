"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome to the admin panel!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || error.response?.data?.detail || "Login failed.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--admin-bg)",
      padding: 24,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-20%", left: "30%",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(107,31,58,0.15) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "20%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--admin-bg-card)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius-lg)",
          padding: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "var(--admin-radius)",
            background: "linear-gradient(135deg, var(--admin-primary), var(--admin-accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Shield size={28} color="#fff" />
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700, fontSize: 24,
            background: "linear-gradient(135deg, #C9A84C, #D4B96A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Zari & Jasi
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-dim)", marginTop: 4 }}>Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="admin-input" style={{ paddingLeft: 38 }} placeholder="admin@zarijasi.com" id="admin-login-email" />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-dim)" }} />
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="admin-input" style={{ paddingLeft: 38, paddingRight: 38 }} placeholder="••••••••" id="admin-login-password" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-dim)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="admin-btn admin-btn-primary" id="admin-login-submit"
            style={{ width: "100%", justifyContent: "center", padding: "13px", marginTop: 8 }}>
            {isLoading ? "Signing in…" : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--admin-text-dim)" }}>
          Authorized personnel only. All actions are logged.
        </p>
      </motion.div>
    </div>
  );
}
