// ─────────────────────────────────────────────
// USER & AUTH TYPES
// ─────────────────────────────────────────────

export type UserRole = "super_admin" | "admin" | "customer";

export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// ─────────────────────────────────────────────
// PRODUCT TYPES
// ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  parent?: Category;
  children?: Category[];
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  color_hex?: string;
  sku: string;
  price_override?: number;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  short_description?: string;
  category_id: string;
  category?: Category;
  base_price: number;
  sale_price?: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  primary_image?: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// CART & WISHLIST TYPES
// ─────────────────────────────────────────────

export interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  product_name: string;
  product_slug: string;
  size?: string;
  color?: string;
  sku: string;
  primary_image?: string;
  stock_qty: number;
  created_at: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  base_price: number;
  sale_price?: number;
  primary_image?: string;
  in_stock: boolean;
  variants: Array<{
    id: string;
    size?: string;
    color?: string;
    stock_qty: number;
    is_active: boolean;
  }>;
  created_at: string;
}

// ─────────────────────────────────────────────
// COUPON TYPES
// ─────────────────────────────────────────────

export type CouponType = "percent" | "flat";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface CouponApplyResult {
  valid: boolean;
  coupon?: Coupon;
  discount_amount: number;
  message?: string;
}

// ─────────────────────────────────────────────
// ORDER TYPES
// ─────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "return_initiated"
  | "returned";

export type PaymentMethod = "razorpay" | "cod";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface ProductSnapshot {
  product_id: string;
  product_name: string;
  variant_id: string;
  size?: string;
  color?: string;
  sku: string;
  image_url?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  provider_id: string;
  provider_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  status: string;
  notes?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  r2_url?: string;
  generated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  user?: Pick<User, "id" | "email" | "first_name" | "last_name" | "phone">;
  address_id: string;
  address?: Address;
  coupon_id?: string;
  coupon?: Coupon;
  items: OrderItem[];
  payment?: Payment;
  shipment?: Shipment;
  invoice?: Invoice;
  subtotal: number;
  discount: number;
  shipping_charge: number;
  tax_amount: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// SHIPPING TYPES
// ─────────────────────────────────────────────

export type ShippingProviderSlug = "manual" | "shiprocket" | "delhivery" | "ekart";

export interface ShippingProvider {
  id: string;
  name: string;
  slug: ShippingProviderSlug;
  is_active: boolean;
  is_configured: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
  errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────
// DASHBOARD TYPES (ADMIN)
// ─────────────────────────────────────────────

export interface DashboardStats {
  total_revenue: number;
  revenue_growth: number;
  total_orders: number;
  orders_growth: number;
  total_customers: number;
  customers_growth: number;
  low_stock_count: number;
  total_products: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  image_url?: string;
  total_sold: number;
  total_revenue: number;
}
