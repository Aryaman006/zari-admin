import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const req = error.config;
    if (error.response?.status === 401 && !req._retry) {
      req._retry = true;
      try {
        const rt = localStorage.getItem("admin_refresh_token");
        if (!rt) throw new Error();
        const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refresh_token: rt });
        localStorage.setItem("admin_access_token", data.access_token);
        localStorage.setItem("admin_refresh_token", data.refresh_token);
        req.headers.Authorization = `Bearer ${data.access_token}`;
        return api(req);
      } catch {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: object) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

export const adminApi = {
  getStats: (days?: number) => api.get("/admin/dashboard/stats", { params: { period_days: days } }),
  getRevenueChart: (days?: number) => api.get("/admin/dashboard/revenue-chart", { params: { days } }),
  getTopProducts: () => api.get("/admin/dashboard/top-products"),

  // Products
  listProducts: (params?: object) => api.get("/admin/products", { params }),
  getProduct: (id: string) => api.get(`/admin/products/${id}`),
  createProduct: (data: object) => api.post("/admin/products", data),
  updateProduct: (id: string, data: object) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  addVariant: (pid: string, data: object) => api.post(`/admin/products/${pid}/variants`, data),
  updateVariant: (pid: string, vid: string, data: object) => api.put(`/admin/products/${pid}/variants/${vid}`, data),
  deleteVariant: (pid: string, vid: string) => api.delete(`/admin/products/${pid}/variants/${vid}`),
  getUploadUrl: (pid: string, filename: string) => api.post(`/admin/products/${pid}/images/upload-url`, null, { params: { filename } }),
  addImage: (pid: string, data: { r2_key: string; url: string; alt_text?: string; is_primary?: boolean }) => api.post(`/admin/products/${pid}/images`, null, { params: data }),
  deleteImage: (pid: string, imageId: string) => api.delete(`/admin/products/${pid}/images/${imageId}`),
  reorderImages: (pid: string, imageIds: string[]) => api.put(`/admin/products/${pid}/images/reorder`, imageIds),

  // Categories
  listCategories: () => api.get("/admin/categories"),
  createCategory: (data: object) => api.post("/admin/categories", data),
  updateCategory: (id: string, data: object) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  // Orders
  listOrders: (params?: object) => api.get("/admin/orders", { params }),
  getOrder: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, data: object) => api.put(`/admin/orders/${id}/status`, data),
  generateInvoice: (id: string) => api.post(`/admin/orders/${id}/generate-invoice`),

  // Customers
  listCustomers: (params?: object) => api.get("/admin/customers", { params }),
  getCustomer: (id: string) => api.get(`/admin/customers/${id}`),

  // Coupons
  listCoupons: () => api.get("/admin/coupons"),
  createCoupon: (data: object) => api.post("/admin/coupons", null, { params: data }),
  updateCoupon: (id: string, data: object) => api.put(`/admin/coupons/${id}`, data),
  toggleCoupon: (id: string) => api.put(`/admin/coupons/${id}/toggle`),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),

  // Shipping
  listProviders: () => api.get("/admin/shipping/providers"),
  activateProvider: (id: string) => api.post(`/admin/shipping/providers/${id}/activate`),
  configureProvider: (id: string, config: object) => api.post(`/admin/shipping/providers/${id}/configure`, config),
  createShipment: (orderId: string, data?: object) => api.post(`/admin/shipping/shipments/${orderId}`, null, { params: data }),
  updateShipment: (id: string, data: object) => api.put(`/admin/shipping/shipments/${id}`, null, { params: data }),

  // Inventory
  getInventory: (params?: object) => api.get("/admin/inventory", { params }),
  updateStock: (variantId: string, qty: number) => api.put(`/admin/inventory/${variantId}`, null, { params: { stock_qty: qty } }),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data: object) => api.put("/admin/settings", data),
};
