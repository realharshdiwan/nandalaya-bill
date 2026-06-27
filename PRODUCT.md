# Nandalaya — Product Specification

## What Is This?

Nandalaya is a school uniform & garment business management app. It replaces paper price books, manual billing, and memory-dependent operations with a simple digital system.

**Target users:** Shop owner, family members, 2-3 staff (non-technical).
**Philosophy:** Apple-like simplicity. Fewer screens, fewer buttons, less training.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui v4 (base-ui primitives, NOT Radix) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Hosting | Vercel |
| Language | TypeScript |

### Critical Next.js 16 Conventions

- **Proxy, not middleware:** `proxy.ts` in project root, exports `proxy` function
- **Server Components by default:** Add `"use client"` only for useState/useEffect/event handlers
- **Async params:** `params` is a `Promise` — must `await params`
- **base-ui Dialog:** Use `render` prop, NOT `asChild`
- **base-ui Select:** `onValueChange` receives `(value: string | null)`
- **Supabase joins return arrays:** Always normalize with `Array.isArray(x) ? x[0] : x`

---

## Database Schema

### Phase 1 — Uniform Master (DONE)

```
schools
  id UUID PK
  name TEXT
  short_code TEXT        -- "DAV", "KV" for quick search
  is_active BOOLEAN

products
  id UUID PK
  name TEXT              -- "Shirt", "Pant", "Tie"
  category TEXT          -- uniform, accessory, garment

sizes
  id UUID PK
  label TEXT             -- "24", "26", "S", "M"
  numeric_value NUMERIC  -- for sorting

price_list              -- THE PRICE MATRIX
  id UUID PK
  school_id FK → schools
  product_id FK → products
  size_id FK → sizes
  price NUMERIC(10,2)    -- GST-inclusive ₹
  is_active BOOLEAN
  UNIQUE(school_id, product_id, size_id)
```

### Phase 2 — Billing (TO BUILD)

```
bills
  id UUID PK
  bill_number TEXT UNIQUE  -- "NY-2026-0001"
  customer_name TEXT
  customer_phone TEXT
  school_id FK → schools
  items JSONB              -- [{product_id, size_id, product_name, size_label, qty, price, subtotal}]
  subtotal NUMERIC(10,2)
  discount NUMERIC(10,2) DEFAULT 0
  total NUMERIC(10,2)
  payment_method TEXT      -- cash, upi, card, credit
  notes TEXT
  created_at TIMESTAMPTZ

bill_items
  id UUID PK
  bill_id FK → bills
  product_id FK → products
  size_id FK → sizes
  qty INT
  price NUMERIC(10,2)
  subtotal NUMERIC(10,2)
```

### Phase 3 — Inventory (FUTURE)

```
inventory
  id UUID PK
  product_id FK → products
  size_id FK → sizes
  quantity INT DEFAULT 0
  low_stock_threshold INT DEFAULT 5
  updated_at TIMESTAMPTZ
  UNIQUE(product_id, size_id)
```

### Phase 4 — Customer Memory (FUTURE)

```
customers
  id UUID PK
  name TEXT
  phone TEXT UNIQUE
  notes TEXT
  created_at TIMESTAMPTZ
```

### Phase 5 — Pending Orders (FUTURE)

```
pending_orders
  id UUID PK
  customer_id FK → customers
  phone TEXT
  items JSONB
  delivery_date DATE
  status TEXT  -- pending, stitching, ready, delivered
  notes TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx        — Email/password login
│   ├── (dashboard)/
│   │   ├── layout.tsx               — Auth guard + Sidebar
│   │   ├── page.tsx                 — Home: universal search
│   │   ├── schools/
│   │   │   ├── page.tsx             — Schools list (Server)
│   │   │   ├── new/page.tsx         — Add school form
│   │   │   └── [id]/page.tsx        — School detail (Server)
│   │   ├── products/
│   │   │   ├── page.tsx             — Products list (Server)
│   │   │   └── new-product-dialog.tsx — Add product dialog
│   │   ├── prices/page.tsx          — Price matrix CRUD
│   │   ├── bills/
│   │   │   ├── page.tsx             — Bills list
│   │   │   ├── new/page.tsx         — Create new bill
│   │   │   └── [id]/page.tsx        — Bill detail/receipt
│   │   └── settings/page.tsx        — Sizes management
│   ├── auth/callback/route.ts       — OAuth callback
│   └── global-error.tsx             — Global error boundary
├── components/
│   ├── sidebar.tsx                  — Fixed sidebar nav
│   └── ui/                          — shadcn/ui components
└── lib/
    ├── supabase/
    │   ├── client.ts                — Browser client
    │   ├── server.ts                — Server client
    │   └── middleware.ts            — Session refresh
    └── utils.ts                     — cn() helper
```

---

## Pages & Workflows

### Phase 1 (DONE)

| Page | Route | Type | Purpose |
|------|-------|------|---------|
| Login | `/login` | Client | Email/password sign in |
| Home | `/` | Client | Universal search bar |
| Schools | `/schools` | Server | List all schools |
| School Detail | `/schools/[id]` | Server | Prices grouped by product |
| New School | `/schools/new` | Client | Add school form |
| Products | `/products` | Server | List all products |
| Prices | `/prices` | Client | Price matrix with school filter |
| Settings | `/settings` | Client | Manage sizes |

### Phase 2 (DONE)

| Page | Route | Type | Purpose |
|------|-------|------|---------|
| Bills List | `/bills` | Server | All bills, searchable |
| New Bill | `/bills/new` | Client | Create invoice workflow |
| Bill Detail | `/bills/[id]` | Server | View receipt |

---

## Design Principles

1. **Search is king.** Home screen = search bar. Type anything, get instant results.
2. **Cards over tables.** Tables suck on mobile. Use card layouts.
3. **Warm saffron/amber theme.** orange-600 primary. Clean white background.
4. **Mobile-first.** Every screen works on 320px+ phones.
5. **Inline errors.** No error modals. Show errors where they happen.
6. **Two-click rule.** Any action should take max 2 clicks/taps.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://ryhltvwitharelsumfem.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

---

## Build Commands

```bash
npm run dev     # Development (http://localhost:3000)
npm run build   # Production build (type-checks)
npm run lint    # ESLint
```

---

## Known Patterns

### Supabase Join Normalization
```ts
// Supabase returns arrays for joined tables
const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
```

### base-ui Dialog (NOT Radix)
```tsx
// Use render prop, NOT asChild
<DialogTrigger render={<Button />}>Click me</DialogTrigger>
```

### base-ui Select
```tsx
// onValueChange receives string | null
<Select value={val} onValueChange={(v) => setVal(v ?? "default")}>
```

### Async Params (Next.js 16)
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

---

## Future Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Uniform Master | DONE | Price lookup, schools, products, sizes |
| 2. Billing | DONE | Invoice generation with line items |
| 3. Inventory | PLANNED | Stock tracking, low stock alerts |
| 4. Customer Memory | PLANNED | Purchase history, "same as last year" |
| 5. Pending Orders | PLANNED | Order tracking with statuses |
| 6. Barcode | FUTURE | Scan items for faster billing |
| 7. Analytics | FUTURE | Revenue, trends, insights |
