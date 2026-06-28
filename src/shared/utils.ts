// ─────────────────────────────────────────────
// CURRENCY UTILITIES
// ─────────────────────────────────────────────

/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate discount percentage
 */
export function discountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

// ─────────────────────────────────────────────
// STRING UTILITIES
// ─────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

// ─────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────

/**
 * Format date in Indian locale
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

/**
 * Format date with time
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} days ago`;
  return formatDate(dateStr);
}

// ─────────────────────────────────────────────
// ORDER UTILITIES
// ─────────────────────────────────────────────

import type { OrderStatus } from "@zari/shared-types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  return_initiated: "Return Initiated",
  returned: "Returned",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "amber",
  confirmed: "blue",
  processing: "purple",
  shipped: "cyan",
  out_for_delivery: "orange",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
  return_initiated: "yellow",
  returned: "slate",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? titleCase(status);
}

// ─────────────────────────────────────────────
// VALIDATION UTILITIES
// ─────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidPhone(phone: string): boolean {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

export function isValidPincode(pincode: string): boolean {
  const re = /^[1-9][0-9]{5}$/;
  return re.test(pincode);
}

// ─────────────────────────────────────────────
// MISC UTILITIES
// ─────────────────────────────────────────────

/**
 * Generate a random string of a given length (for IDs, tokens, etc.)
 */
export function randomString(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
