# MongoDB Atlas Database Setup & Credentials Guide

This document stores the database credentials and instructions for connecting MongoDB Atlas to the **Cafe POS** application.

---

## 1. Database Credentials

| Field | Value |
| :--- | :--- |
| **Username** | `rabadiyameet09_db_user` |
| **Password** | `OYfxmkTuAv9BhBLa` |
| **Database Name** | `cafe_pos` |
| **Cluster Name** | `Cluster0` |
| **Project URL** | [MongoDB Atlas Project Overview](https://cloud.mongodb.com/v2/6aba5dd6452b56b45b5e42fb#/overview) |

---

## 2. Connection String Template

Once you obtain your cluster hostname from the Atlas dashboard:

```env
MONGODB_URI=mongodb+srv://rabadiyameet09_db_user:OYfxmkTuAv9BhBLa@<cluster-host>/cafe_pos?retryWrites=true&w=majority
```

*(Replace `<cluster-host>` with your cluster address, e.g. `cluster0.abcde.mongodb.net`)*

---

## 3. How to Complete Atlas Setup (In Open Browser Modal)

1. In the **"Connect to Cluster0"** modal:
   - Click the green button **"Choose a connection method"** at the bottom right.
   - Select **"Drivers"** (Node.js).
   - Under Step 3, copy the connection string and extract your `<cluster-host>` hostname.
2. In MongoDB Atlas left sidebar under **Security**:
   - Click **Network Access**.
   - Click **+ Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. *(Required for Vercel serverless functions to connect).*

---

## 4. Where to Set the Connection String

### A. On Hosted Vercel Production
1. Go to your **Vercel Dashboard** &rarr; Project **`cafe-pos-odoo`**.
2. Navigate to **Settings** &rarr; **Environment Variables**.
3. Add a new variable:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://rabadiyameet09_db_user:OYfxmkTuAv9BhBLa@<cluster-host>/cafe_pos?retryWrites=true&w=majority`
4. Click **Save** and trigger a **Redeploy**.

### B. Local Development (`backend/.env`)
Edit `backend/.env` and paste:
```env
MONGODB_URI=mongodb+srv://rabadiyameet09_db_user:OYfxmkTuAv9BhBLa@<cluster-host>/cafe_pos?retryWrites=true&w=majority
```

---

## 5. Dual-Mode Architecture

The backend includes a dual-mode database engine:
* **Active Mode without Atlas URI:** Operates seamlessly with the zero-latency In-Memory Database store (`memStore.js`), preloaded with 3 floors, 9 tables, 6 categories, 18 menu products, and demo accounts.
* **Atlas Connected Mode:** When a valid `MONGODB_URI` is provided, it automatically switches to native MongoDB Mongoose schemas with full cloud persistence.
