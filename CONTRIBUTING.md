# Contributing — Developer Onboarding Guide

> Everything a new developer needs to understand, set up, and work on this project.

---

## Project Overview

**Cafe POS** is a full-stack restaurant Point-of-Sale system with 4 user roles:

| Role | What they do | Route prefix |
|------|-------------|-------------|
| **Admin** | Manage menu, floors, tables, view reports | `/admin/*` |
| **Cashier** | Take orders, process payments, manage shifts | `/cashier/*` |
| **Customer** | Self-order via QR code (no login needed) | `/customer/*` |
| **Kitchen** | View & manage incoming orders | `/kitchen/*` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Backend | Node.js 18+ / Express 4 |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.IO |
| Deployment | Vercel (serverless functions) |

---

## Folder Structure

```
├── api/                    # Vercel serverless entry point
│   └── index.js            # Wraps Express app for Vercel
│
├── backend/
│   ├── src/
│   │   ├── app.js          # Express app setup (middleware, routes)
│   │   ├── server.js       # HTTP server + Socket.IO (local dev)
│   │   ├── config/         # Environment, database, Supabase config
│   │   ├── controllers/    # Request handlers (1 per resource)
│   │   ├── middleware/      # Auth, validation, error handling, logging
│   │   ├── models/         # Supabase query wrappers
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Business logic (cache, monitoring, etc.)
│   │   ├── sockets/        # Socket.IO event handlers
│   │   ├── jobs/           # Background jobs (cleanup, etc.)
│   │   ├── utils/          # Logger, query optimizer, helpers
│   │   └── validators/     # Input validation schemas
│   ├── scripts/            # Standalone utility/test scripts
│   ├── tests/              # Jest test suites (e2e, property)
│   └── postman/            # Postman API collection
│
├── frontend/
│   ├── src/                # React application
│   │   ├── App.jsx         # Root component — ALL routes defined here
│   │   ├── main.jsx        # Entry point (ReactDOM.createRoot)
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layouts/    # AdminLayout, CashierLayout, CustomerLayout, KitchenLayout
│   │   │   ├── admin/      # Admin-specific components
│   │   │   ├── cashier/    # Cashier-specific components
│   │   │   ├── customer/   # Customer-specific components
│   │   │   └── kitchen/    # Kitchen-specific components
│   │   ├── pages/          # Page components (1 per route)
│   │   │   ├── admin/      # Dashboard, Products, Floors, etc.
│   │   │   ├── cashier/    # Dashboard, Orders, Floor, etc.
│   │   │   ├── customer/   # Floors, Menu, Cart, Payment, etc.
│   │   │   └── kitchen/    # Dashboard
│   │   ├── contexts/       # React Context (Auth, Theme)
│   │   ├── hooks/          # Custom hooks (caching, error handling)
│   │   ├── services/       # API client, Supabase, Socket.IO
│   │   └── utils/          # Constants, formatters, error handler
│   ├── js/                 # Vanilla JS (landing page — NOT React)
│   ├── css/                # Vanilla CSS (landing page — NOT React)
│   └── public/             # Static assets
│
├── index.html              # Landing page (vanilla HTML — NOT React)
├── tailwind.config.js      # Tailwind config for landing page
├── vercel.json             # Vercel deployment configuration
├── problem statement/      # Original hackathon materials
└── package.json            # Root package.json (install scripts)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- A Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd Cafe-POS-Odoo-Adani-Hackathon-main

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 2. Set Up Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Supabase URL and anon key
```

### 3. Set Up Database

```bash
cd backend
node scripts/setup-database.js
```

### 4. Run Development Servers

```bash
# From project root — starts both backend and frontend
npm run dev

# Or separately:
npm run dev:backend   # Express API on http://localhost:3000
npm run dev:frontend  # Vite dev server on http://localhost:5173
```

---

## Key Architecture Decisions

1. **Dual frontend**: The root `index.html` is a standalone landing page (vanilla JS/CSS). The actual app lives in `frontend/src/` (React + Vite). Both are deployed together on Vercel.

2. **Vercel serverless**: `api/index.js` wraps the Express app as a serverless function. All API requests are routed through `/api/*` via `vercel.json` rewrites.

3. **Customer flow is public**: Customer pages (`/customer/*`) don't require login. Customers scan a QR code → select floor/table → browse menu → order → pay.

4. **Auth flow**: JWT stored in localStorage. `AuthContext.jsx` manages token state. `ProtectedRoute.jsx` guards role-based routes.

5. **Global toast notifications**: Use `showToast('message', 'type')` from `components/Toast.jsx`. Never create local toast state in pages.

6. **Theme**: Always defaults to light mode. Toggle via `ThemeContext.jsx`.

---

## Common Tasks

### Add a new API endpoint
1. Create controller in `backend/src/controllers/`
2. Create route file in `backend/src/routes/`
3. Register route in `backend/src/routes/index.js`
4. Add validation in `backend/src/validators/` (optional)

### Add a new page
1. Create page component in `frontend/src/pages/<role>/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in the appropriate layout component

### Add a new service
1. Create in `backend/src/services/`
2. Import and use in the relevant controller

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (server-side only) |
| `JWT_SECRET` | Yes (prod) | Secret for signing JWTs |
| `PORT` | No | Server port (default: 3000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `UPI_ID` | No | Merchant UPI ID for payments |
| `MERCHANT_NAME` | No | Display name on payment QR |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL (default: /api) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |

---

## Deployment (Vercel)

The project is configured for one-click Vercel deployment:

1. Import repo in Vercel dashboard
2. Set environment variables (see table above)
3. Build command: `cd frontend && npm install && npm run build`
4. Output directory: `frontend/dist`
5. Deploy — API routes are handled by `api/index.js` serverless function
