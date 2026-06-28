# Zari & Jasi Admin Dashboard

A premium administrative back-office portal built using Next.js, React, Zustand, React Query, and Recharts.

---

## Technical Stack
- **Next.js (App Router)**: Framework supporting clean directory routing and Server Components.
- **TailwindCSS**: CSS framework for unified modern dashboards.
- **React Query**: API request state cache management.
- **Recharts**: Responsive sales metrics charts.
- **Lucide React**: Administrative UI iconography.

---

## Features
- **Dynamic Stats Header**: Real-time sales growth rate indicators and product inventory levels.
- **Catalog Editor**: Direct management of categories, subcategories, inventory stocks, products, and color variant diffs.
- **Sales Fulfilment**: Order status timelines and shipping provider maps configuration.
- **Global Settings Control**: Store coordinates editing, CGST/SGST tax ratios adjustment, and API tokens (Razorpay/Resend) configuration.

---

## Environment Variables Configuration

Create a `admin-frontend/.env.local` file and declare:

```bash
# 1. API Endpoint URL (must point to backend Render service or localhost)
NEXT_PUBLIC_API_URL=http://localhost:8000

# 2. Supabase project URL (used to load catalog images from the public CDN)
# Example: https://abcdef.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co

# 3. App identity name
NEXT_PUBLIC_APP_NAME="Zari & Jasi Admin"
```

---

## Local Development Setup

### 1. Prerequisites
Ensure Node.js v20+ and npm are installed.

### 2. Install Dependencies
```bash
# Navigate to the admin-frontend directory
cd admin-frontend

# Install packages
npm install
```

### 3. Run Dev Server
```bash
npm run dev
```
Open `http://localhost:3001` in your web browser.

---

## Production Build & Vercel Deployment

Next.js projects deploy automatically to Vercel with zero-config optimization.

To verify build correctness locally before deploying:
```bash
# Run build locally
npm run build

# Start production server locally
npm run start
```
For production deployment guides, refer to `/docs/deploy-admin.md`.
