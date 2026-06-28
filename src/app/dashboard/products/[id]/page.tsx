"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Plus, Trash2, Upload, X, Save, ArrowLeft, Star, StarOff,
  ArrowUp, ArrowDown, Edit3, Lock, CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import type { Product, ProductVariant, ProductImage, Category } from "@zari/shared-types";

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const COLOR_PRESETS = [
  { name: "Black", hex: "#000000" },
  { name: "Off White", hex: "#FAF9F6" },
  { name: "Red", hex: "#EF4444" },
  { name: "Maroon", hex: "#800000" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Emerald Green", hex: "#50C878" },
  { name: "Pink", hex: "#FFC0CB" },
];

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";

  const [productData, setProductData] = useState<Partial<Product>>({
    name: "",
    slug: "",
    brand: "",
    description: "",
    short_description: "",
    base_price: 0,
    sale_price: undefined,
    category_id: undefined,
    is_active: true,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    tags: [],
  });

  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
  const [images, setImages] = useState<Partial<ProductImage>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [customSKUMap, setCustomSKUMap] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.listCategories().then((r) => r.data),
  });

  const { data: existingProduct, isLoading: productLoading } = useQuery({
    queryKey: ["admin", "product", params.id],
    queryFn: () => {
      if (isNew) return null;
      return adminApi.getProduct(params.id as string).then((r) => r.data);
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingProduct) {
      setProductData(existingProduct);
      setVariants(existingProduct.variants || []);
      setImages(existingProduct.images || []);
    }
  }, [existingProduct]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const autoSKU = (prodName: string, size: string, color: string, index: number) => {
    if (customSKUMap[index] && variants[index]?.sku) {
      return variants[index].sku;
    }
    const pCode = (prodName || "PROD").slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cCode = (color || "VAR").slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const sCode = (size || "SZ").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `${pCode}-${cCode}-${sCode}`.replace(/-+/g, "-");
  };

  // Sync SKUs when name, variants change
  useEffect(() => {
    if (productData.name) {
      setVariants((prev) =>
        prev.map((v, idx) => {
          if (customSKUMap[idx]) return v;
          return {
            ...v,
            sku: autoSKU(productData.name!, v.size || "", v.color || "", idx),
          };
        })
      );
    }
  }, [productData.name]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Create or Update Product Basic details
      let product: Product;
      if (isNew) {
        // Create product with variants in one shot
        const created = await adminApi.createProduct({
          ...productData,
          variants: variants.map((v) => ({ ...v, sku: v.sku || "AUTO" })),
        } as any);
        product = created.data;
      } else {
        const updated = await adminApi.updateProduct(params.id as string, productData as any);
        product = updated.data;

        // Sync Variants for existing product (diffing)
        const originalVariants = existingProduct?.variants || [];
        const originalIds: string[] = originalVariants.map((ov: ProductVariant) => ov.id);
        const currentIds: string[] = variants.filter((v: Partial<ProductVariant>) => v.id).map((v: Partial<ProductVariant>) => v.id!);

        // - Delete variants not present anymore
        const deletedIds: string[] = originalIds.filter((oid: string) => !currentIds.includes(oid));
        const deleteCalls = deletedIds.map((did: string) => adminApi.deleteVariant(product.id, did));

        // - Create/Update variants
        const saveCalls = variants.map((v, index) => {
          const vData = {
            sku: v.sku || autoSKU(product.name, v.size || "", v.color || "", index),
            size: v.size || null,
            color: v.color || null,
            color_hex: v.color_hex || null,
            price_override: v.price_override || null,
            stock_qty: v.stock_qty || 0,
            is_active: v.is_active ?? true,
          };
          if (v.id) {
            // Update
            const orig = originalVariants.find((ov: ProductVariant) => ov.id === v.id);
            const hasChanged =
              orig?.sku !== vData.sku ||
              orig?.size !== vData.size ||
              orig?.color !== vData.color ||
              orig?.stock_qty !== vData.stock_qty ||
              orig?.is_active !== vData.is_active;

            if (hasChanged) {
              return adminApi.updateVariant(product.id, v.id, vData);
            }
            return Promise.resolve(null);
          } else {
            // Create
            return adminApi.addVariant(product.id, vData);
          }
        });

        await Promise.all([...deleteCalls, ...saveCalls]);

        // Sync Image display orders
        if (images.length > 0) {
          const imageIds = images.filter((img) => img.id).map((img) => img.id!);
          await adminApi.reorderImages(product.id, imageIds);
        }
      }
      return product;
    },
    onSuccess: (product) => {
      toast.success(isNew ? "Product created successfully!" : "Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "product", product.id] });
      router.push("/dashboard/products");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to save product.");
    },
  });

  const addVariantState = () => {
    setVariants((prev) => {
      const idx = prev.length;
      return [
        ...prev,
        {
          sku: autoSKU(productData.name || "", "", "", idx),
          size: "",
          color: "",
          color_hex: "",
          price_override: undefined,
          stock_qty: 0,
          is_active: true,
        } as Partial<ProductVariant>,
      ];
    });
  };

  const updateVariantState = (index: number, updates: Partial<ProductVariant>) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      const current = newVariants[index];
      const merged = { ...current, ...updates };
      
      // Update SKU if size or color updated, unless overridden
      if (!customSKUMap[index] && (updates.size !== undefined || updates.color !== undefined)) {
        merged.sku = autoSKU(productData.name || "", merged.size || "", merged.color || "", index);
      }
      newVariants[index] = merged;
      return newVariants;
    });
  };

  const removeVariantState = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setCustomSKUMap((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew) {
      if (isNew) toast.error("Please save the product basic info first before uploading media.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const key = `products/${params.id}/${Date.now()}-${file.name}`;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/uploads/direct?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_access_token")}`,
          },
        }
      );
      
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      
      const newImage = await adminApi.addImage(params.id as string, {
        r2_key: result.key,
        url: result.public_url,
        alt_text: file.name,
        is_primary: images.length === 0,
      });
      
      setImages((prev) => [...prev, newImage.data]);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await adminApi.deleteImage(params.id as string, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete image");
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const newImages = [...prev];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return newImages;
    });
  };

  if (productLoading) {
    return <div style={{ textAlign: "center", padding: 80, color: "var(--admin-text-dim)" }}>Loading product editor...</div>;
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
            {isNew ? "Create Product" : `Edit: ${productData.name}`}
          </h1>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            {isNew ? "Set up your new product listings" : `ID: ${productData.id}`}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="admin-btn admin-btn-primary"
            style={{ minWidth: 100 }}
          >
            <Save size={16} /> {saveMutation.isPending ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* Main Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Basic Information */}
          <div className="admin-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--admin-border)", paddingBottom: 10 }}>
              Basic Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="admin-form-label">Product Name *</label>
                <input
                  className="admin-input"
                  value={productData.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    setProductData((prev) => ({
                      ...prev,
                      name,
                      slug: isNew ? generateSlug(name) : prev.slug,
                    }));
                  }}
                  placeholder="e.g. Handwoven Silk Banarasi Saree"
                />
              </div>
              <div>
                <label className="admin-form-label">Product Slug *</label>
                <input
                  className="admin-input"
                  value={productData.slug || ""}
                  onChange={(e) => setProductData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  placeholder="e.g. silk-banarasi-saree"
                />
              </div>
              <div>
                <label className="admin-form-label">Brand</label>
                <input
                  className="admin-input"
                  value={productData.brand || ""}
                  onChange={(e) => setProductData((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g. Zari & Jasi Premium"
                />
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="admin-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--admin-border)", paddingBottom: 10 }}>
              Descriptions
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label className="admin-form-label">Short Description</label>
              <textarea
                className="admin-input"
                value={productData.short_description || ""}
                onChange={(e) => setProductData((prev) => ({ ...prev, short_description: e.target.value }))}
                rows={2}
                placeholder="A quick summary shown on catalog cards (max 200 chars)"
              />
            </div>
            <div>
              <label className="admin-form-label">Full Description</label>
              <div style={{ border: "1px solid var(--admin-border)", borderRadius: "var(--admin-radius-sm)", background: "var(--admin-bg)", overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--admin-border)", background: "var(--admin-bg-hover)", fontSize: 12, color: "var(--admin-text-muted)" }}>
                  <strong>Rich Text Editor Mock</strong>
                  <span>| Use standard text markup</span>
                </div>
                <textarea
                  className="admin-input"
                  value={productData.description || ""}
                  onChange={(e) => setProductData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  placeholder="Describe the material, weave technique, matching tips, drape guidelines, etc."
                  style={{ border: "none", borderRadius: 0, resize: "vertical", background: "transparent" }}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="admin-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--admin-border)", paddingBottom: 10 }}>
              Pricing
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="admin-form-label">Price (₹) *</label>
                <input
                  type="number"
                  className="admin-input"
                  value={productData.base_price || ""}
                  onChange={(e) => setProductData((prev) => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="3499"
                  min="0"
                />
              </div>
              <div>
                <label className="admin-form-label">Sale Price (₹)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={productData.sale_price || ""}
                  onChange={(e) => setProductData((prev) => ({ ...prev, sale_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="2999"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Variants Table */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--admin-border)", paddingBottom: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Product Variants</h3>
              <button
                type="button"
                onClick={addVariantState}
                className="admin-btn admin-btn-primary"
                style={{ fontSize: 12, padding: "6px 12px" }}
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-text-dim)", fontSize: 13 }}>
                No variants added. Store owners must configure at least one variant (e.g. Free Size / Default).
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>Size</th>
                      <th style={{ width: 140 }}>Color</th>
                      <th style={{ width: 90 }}>Stock</th>
                      <th>SKU</th>
                      <th style={{ width: 90 }}>Status</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            list="sizes-datalist"
                            className="admin-input"
                            style={{ padding: "6px 10px", fontSize: 13 }}
                            value={v.size || ""}
                            onChange={(e) => updateVariantState(index, { size: e.target.value })}
                            placeholder="e.g. M"
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              className="admin-input"
                              style={{ padding: "6px 10px", fontSize: 13 }}
                              value={v.color || ""}
                              onChange={(e) => {
                                const cName = e.target.value;
                                const match = COLOR_PRESETS.find((cp) => cp.name.toLowerCase() === cName.toLowerCase());
                                updateVariantState(index, { color: cName, color_hex: match ? match.hex : v.color_hex });
                              }}
                              placeholder="e.g. Maroon"
                            />
                            <input
                              type="color"
                              style={{ width: 24, height: 24, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}
                              value={v.color_hex || "#800000"}
                              onChange={(e) => updateVariantState(index, { color_hex: e.target.value })}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ padding: "6px 10px", fontSize: 13 }}
                            value={v.stock_qty ?? 0}
                            onChange={(e) => updateVariantState(index, { stock_qty: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {customSKUMap[index] ? (
                              <input
                                className="admin-input"
                                style={{ padding: "6px 8px", fontSize: 12, fontFamily: "monospace" }}
                                value={v.sku || ""}
                                onChange={(e) => updateVariantState(index, { sku: e.target.value })}
                                placeholder="CUSTOM-SKU"
                              />
                            ) : (
                              <code style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                                {v.sku || autoSKU(productData.name || "", v.size || "", v.color || "", index)}
                              </code>
                            )}
                            <button
                              type="button"
                              onClick={() => setCustomSKUMap({ ...customSKUMap, [index]: !customSKUMap[index] })}
                              className="admin-btn admin-btn-ghost"
                              style={{ padding: 4 }}
                              title="Edit SKU manually"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-input"
                            style={{ padding: "6px 8px", fontSize: 12 }}
                            value={v.is_active ? "active" : "inactive"}
                            onChange={(e) => updateVariantState(index, { is_active: e.target.value === "active" })}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeVariantState(index)}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: 6, color: "var(--admin-error)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Status & Visibility */}
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Product Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select
                className="admin-input"
                value={productData.is_active ? "active" : "draft"}
                onChange={(e) => setProductData((p) => ({ ...p, is_active: e.target.value === "active" }))}
              >
                <option value="active">🟢 Active (Storefront Visible)</option>
                <option value="draft">🟡 Draft (Hidden / Editing)</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={productData.is_featured}
                  onChange={(e) => setProductData((p) => ({ ...p, is_featured: e.target.checked }))}
                />
                Show on Homepage (Featured)
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Categories</h3>
            <label className="admin-form-label" style={{ fontSize: 11 }}>Select Category *</label>
            <select
              className="admin-input"
              value={productData.category_id || ""}
              onChange={(e) => setProductData((p) => ({ ...p, category_id: e.target.value || undefined }))}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_id ? `— ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Media Images */}
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Media Gallery</h3>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            {isNew ? (
              <div style={{ textAlign: "center", padding: 20, border: "2px dashed var(--admin-border)", borderRadius: "var(--admin-radius-md)", color: "var(--admin-text-muted)", fontSize: 12 }}>
                <Lock size={18} style={{ margin: "0 auto 8px", display: "block" }} />
                Please save product details first before uploading images.
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="admin-btn admin-btn-outline"
                  style={{ width: "100%", fontSize: 12, padding: "8px 12px", marginBottom: 12 }}
                >
                  <Upload size={14} /> {uploading ? "Uploading media…" : "Upload Image File"}
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {images.map((img, index) => (
                    <div
                      key={img.id || index}
                      style={{
                        position: "relative",
                        aspectRatio: "3/4",
                        borderRadius: "var(--admin-radius-sm)",
                        overflow: "hidden",
                        border: "1px solid var(--admin-border)",
                        background: "var(--admin-bg)",
                      }}
                    >
                      {img.url && (
                        <Image src={img.url} alt={img.alt_text || "Product image"} fill style={{ objectFit: "cover" }} />
                      )}
                      
                      {/* Control Overlays */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "rgba(11,13,17,0.85)", padding: "4px 8px",
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => moveImage(index, "up")}
                            disabled={index === 0}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 2 }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, "down")}
                            disabled={index === images.length - 1}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 2 }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => img.id && handleDeleteImage(img.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-error)", padding: 2 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {img.is_primary && (
                        <span style={{
                          position: "absolute", top: 6, left: 6,
                          background: "var(--admin-accent)", color: "#000",
                          fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3
                        }}>
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Metadata */}
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Search Engine Listing (SEO)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="admin-form-label" style={{ fontSize: 11 }}>Meta Title</label>
                <input
                  className="admin-input"
                  value={productData.meta_title || ""}
                  onChange={(e) => setProductData((p) => ({ ...p, meta_title: e.target.value }))}
                  placeholder="Search engine title..."
                />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: 11 }}>Meta Description</label>
                <textarea
                  className="admin-input"
                  value={productData.meta_description || ""}
                  onChange={(e) => setProductData((p) => ({ ...p, meta_description: e.target.value }))}
                  rows={3}
                  placeholder="Summary shown on search engines pages..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <datalist id="sizes-datalist">
        {SIZE_PRESETS.map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}




