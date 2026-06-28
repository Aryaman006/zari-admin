import { z } from "zod";

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────

export const registerSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ─────────────────────────────────────────────
// ADDRESS SCHEMAS
// ─────────────────────────────────────────────

export const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
  line1: z.string().min(5, "Address line 1 must be at least 5 characters"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"),
  country: z.string().default("India"),
  is_default: z.boolean().default(false),
});

// ─────────────────────────────────────────────
// PRODUCT SCHEMAS (ADMIN)
// ─────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  short_description: z.string().max(300).optional(),
  category_id: z.string().uuid("Please select a valid category"),
  base_price: z.number().positive("Price must be greater than 0"),
  sale_price: z.number().positive().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  tags: z.array(z.string()).optional(),
});

export const productVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  price_override: z.number().positive().optional().nullable(),
  stock_qty: z.number().int().min(0, "Stock cannot be negative"),
  is_active: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// CATEGORY SCHEMAS (ADMIN)
// ─────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// COUPON SCHEMAS (ADMIN)
// ─────────────────────────────────────────────

export const couponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9]+$/, "Coupon code must be uppercase letters and numbers only"),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive("Discount value must be greater than 0"),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_discount: z.number().positive().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// CHECKOUT SCHEMAS
// ─────────────────────────────────────────────

export const checkoutSchema = z.object({
  address_id: z.string().uuid("Please select a delivery address"),
  payment_method: z.enum(["razorpay", "cod"]),
  coupon_code: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────
// PROFILE SCHEMA
// ─────────────────────────────────────────────

export const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
});

// ─────────────────────────────────────────────
// SHIPPING PROVIDER SCHEMA (ADMIN)
// ─────────────────────────────────────────────

export const shippingProviderConfigSchema = z.object({
  provider_id: z.string().uuid(),
  config: z.record(z.string()),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
