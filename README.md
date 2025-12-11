# SmartPrice Tracker (Supabase + Vercel)

This application is a grocery price tracker and shopping list that syncs to the cloud using Supabase.

---

## 🛠️ Supabase Database Setup (Required)

To make the app work, you must create the tables in Supabase. Because the app sends data with mixed-case keys (like `storeName`), we need to create the tables using **quotes** to preserve case sensitivity in PostgreSQL.

### 1. Create Project
1.  Go to [Supabase.com](https://supabase.com) and sign up.
2.  Click **New Project**.
3.  Give it a name (e.g., "SmartPrice") and a secure password.

### 2. Run SQL Schema
1.  Once your project is created, click on the **SQL Editor** icon in the left sidebar (looks like a terminal `>_`).
2.  Click **New Query**.
3.  **Copy and Paste** the code block below exactly as is:

```sql
-- 1. Create Receipts Table
-- We use quotes " " to ensure column names match the JavaScript JSON keys exactly.
create table receipts (
  id text primary key,
  "storeName" text,
  "date" text,
  "totalAmount" numeric,
  "items" jsonb,
  "rawText" text,
  "createdAt" bigint
);

-- 2. Create Shopping List Table
create table shopping_list (
  id text primary key,
  "name" text,
  "isChecked" boolean
);

-- 3. Enable Public Access (Row Level Security)
-- This allows the app to Read/Write without requiring a user login system.
-- (Safe for personal use, but anyone with your API Key can edit data)

alter table receipts enable row level security;
create policy "Public Access Receipts" on receipts for all using (true) with check (true);

alter table shopping_list enable row level security;
create policy "Public Access List" on shopping_list for all using (true) with check (true);
```

4.  Click **Run** (bottom right). You should see "Success".

### 3. Get API Keys
1.  Go to **Project Settings** (Cog icon at the bottom of the sidebar).
2.  Click **API**.
3.  Copy the **Project URL**.
4.  Copy the **anon / public** Key.

---

## 🚀 Deployment (Vercel)

1.  Upload this code to GitHub.
2.  Go to [Vercel.com](https://vercel.com) and create a new project from your GitHub repo.
3.  In the **Environment Variables** section, add:
    *   `VITE_SUPABASE_URL`: (Your Project URL)
    *   `VITE_SUPABASE_ANON_KEY`: (Your anon Key)
4.  Deploy!

---

## ⚠️ Troubleshooting

**"Uncaught TypeError: Cannot read properties of undefined..."**
*   This usually happens in local preview environments that don't support `import.meta.env`.
*   The code includes a safe check, so if you see this, ensure you are running via `npm run dev` (Vite) or deployed on Vercel.

**"Table not found" or Data not saving**
*   Check your Supabase **RLS Policies**. Ensure you ran the SQL step 3 above ("Public Access"). If RLS is on but no policy exists, Supabase blocks all writes by default.
