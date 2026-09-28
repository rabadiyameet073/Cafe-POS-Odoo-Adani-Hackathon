# 📘 Supabase Architecture & Historical Reference Guide

> **Archival Note:** This document serves as the single source of truth for the project's original Supabase (PostgreSQL) architecture, connection specifications, and real-time subscription model for future reference. The active runtime environment has migrated 100% to **MongoDB Atlas**.

---

## 1. Overview & Credentials Reference

The application was originally architected using **Supabase** as a Backend-as-a-Service (BaaS), combining a managed PostgreSQL relational database with auto-generated PostgREST RESTful APIs and WebSocket-based Realtime subscriptions.

### Environment Variable Format

When configuring Supabase, the following environment variables were used:

```env
# Backend & API Configuration
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend Client Configuration
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Supabase Client Initialization

In the original JavaScript/TypeScript codebase, clients were initialized using `@supabase/supabase-js`:

### Node.js Backend Client (Privileged Service Role)
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
```

### Browser / React Frontend Client (Public Anon Key)
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
```

---

## 3. Relational Schema & Tables (PostgreSQL)

The relational schema comprised 20 core entities defined in SQL. A reference copy is archived in [`database/schema.sql`](file:///database/schema.sql) and [`database/mock_data.sql`](file:///database/mock_data.sql).

### Key Relational Tables:
1. `users` — Authentication accounts (admin, cashier, kitchen, customer)
2. `floors` — Restaurant floor layouts (Ground Floor, First Floor, Rooftop, Terrace)
3. `tables` — Physical dining tables mapped to floors with dynamic statuses (`available`, `occupied`, `reserved`)
4. `table_sessions` — Active dining sessions per table with 90-minute time limits and token authorization
5. `table_timer_logs` — Audit log of timer warning intervals (15m, 10m, 5m, expired)
6. `product_categories` — Menu categories (Beverages, Mains, Desserts, Snacks)
7. `products` — Menu items with prices, tax rates, preparations, and availability toggles
8. `orders` — Customer dine-in, takeaway, and self-order tickets
9. `order_items` — Line items linking products to orders
10. `payments` — Transaction records (Cash, UPI QR, Card, NetBanking)
11. `kitchen_orders` — Live kitchen preparation queue tickets (`to_cook`, `preparing`, `completed`)
12. `cashier_payment_requests` — Real-time queue for cash settlement requests from customer tables
13. `feedback` — Customer ratings and reviews

---

## 4. Supabase Realtime Subscriptions

Real-time reactivity was powered by Supabase PostgreSQL CDC (Change Data Capture) over WebSockets:

```javascript
// Example: Subscribing to live table state changes
const channel = supabase
  .channel('public:tables')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tables' },
    (payload) => {
      console.log('Change received!', payload);
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: New row data
      // payload.old: Previous row data
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

---

## 5. Row-Level Security (RLS) Policies

Under Supabase PostgreSQL, tables utilized Row-Level Security (RLS) policies:

```sql
-- Enable RLS on all tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active tables
CREATE POLICY "Public read available tables" ON tables
  FOR SELECT USING (true);

-- Allow authenticated users to manage orders
CREATE POLICY "Staff manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## 6. Migration to MongoDB Atlas

### Why the Project Migrated:
1. **Serverless Connection Efficiency**: Mongoose handles pooled, cached connections natively in serverless execution environments (Vercel) without hitting PostgreSQL connection limits or requiring Supabase connection pooling (pgbouncer).
2. **Unified Document Model**: Nested order items, sessions, and timer logs map cleanly to MongoDB documents.
3. **Zero Third-Party Vendor Lock-in**: Removes reliance on proprietary Supabase cloud APIs and anon keys.
4. **Transparent Compatibility**: A PostgREST emulation layer (`/rest/v1`) bridges existing query structures directly to MongoDB Atlas.

---
*Maintained for architectural reference.*
