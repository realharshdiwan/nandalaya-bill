# Nandalaya — AI Agent Rules

## Project Overview
School uniform & garment business management app for a small shop in India.

- **Shop:** Nandalaya (school uniforms & garments), 2-3 staff (non-technical)
- **Stack:** Next.js 16 (App Router) + Supabase + shadcn/ui v4 (base-ui, NOT Radix) + Tailwind CSS v4
- **Philosophy:** Apple-like simplicity. Fewer screens, fewer buttons, less training.
- **Design:** Immersive brand-green canvas, white cards with thick black borders, hard offset shadows, skewed Oswald typography. Deep green (#00592B), hot pink (#E374C7), cobalt blue (#0023D1).
- **Hosting:** Deployed on Vercel. Domain TBD.

---

## CRITICAL: Next.js 16 Changes

### Proxy (NOT middleware)
- Next.js 16 renamed `middleware.ts` → `proxy.ts`
- Export `proxy` function, not `middleware`
- File lives in project root: `proxy.ts`
- Used for Supabase session refresh

### Server Components (Default)
- All components are Server Components by default
- Add `"use client"` ONLY when you need `useState`, `useEffect`, event handlers, or browser APIs

### Dynamic Route Params
- `params` is a `Promise` — must `await` it:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### shadcn/ui v4 (base-ui based)
- Uses `@base-ui/react` primitives, NOT Radix UI
- No `asChild` prop on Dialog/Select triggers — use `render` prop instead:
```tsx
<DialogTrigger render={<Button />}>Click me</DialogTrigger>
```
- Select `onValueChange` callback receives `(value: string | null)`, not just `string`

### Supabase Join Responses
- Supabase returns arrays for joined tables, even single rows:
```ts
const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
```

---

## Hardware Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│  Tablet / Phone     │──────│  BT Thermal Printer  │
│  (Nandalaya POS)    │ BLE  │  (ESC/POS, 58/80mm)  │
│  Next.js 16 Web App │      │                      │
│  Shows UPI QR codes │      └──────────────────────┘
│  Accepts cash/UPI   │
└─────────────────────┘
```

### Key Architecture Decisions

1. **Thermal printer connects to tablet/phone via Web Bluetooth** using the ESC/POS protocol. No drivers needed on macOS/Linux (Windows may need WinUSB via Zadig for USB printers).

2. **UPI payments are QR-code based.** The app generates `upi://pay` deep links with exact amounts and displays them as QR codes. The customer scans with any UPI app (PhonePe, GPay, Paytm). Payment goes directly to the shop's UPI ID. The cashier marks the bill as paid manually in the app.

3. **Manual payment confirmation.** No automatic payment detection or webhook integration. The cashier confirms cash/UPI receipts and clicks MARK PAID (or payment_method is set to paid immediately on creation for cash/UPI/card).

4. **No card payment terminal is integrated.** Card payments are recorded manually as a payment_method option. If the shop adds a card machine later, the cashier enters the card amount on that machine separately and marks the bill paid in the app.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                  — Root layout (Oswald font, Toaster, metadata)
│   ├── not-found.tsx               — 404 page
│   ├── global-error.tsx            — Global error boundary
│   ├── manifest.ts                 — PWA manifest
│   │
│   ├── (auth)/
│   │   └── login/page.tsx          — Email/password sign-in (Supabase auth)
│   │
│   ├── auth/callback/route.ts      — OAuth callback
│   │
│   └── (dashboard)/               — Protected by auth check in layout
│       ├── layout.tsx              — Auth-gated shell + sidebar
│       ├── page.tsx                — HOME: Universal search (schools, products, prices)
│       │
│       ├── dashboard/
│       │   ├── page.tsx            — Revenue stats, today's closing, top products, stock alerts
│       │   ├── loading.tsx
│       │   └── error.tsx
│       │
│       ├── schools/
│       │   ├── page.tsx            — SCHOOLS LIST (server component, search)
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   ├── new/page.tsx        — ADD SCHOOL
│       │   └── [id]/
│       │       ├── page.tsx        — SCHOOL DETAIL: Price list + shopping cart
│       │       └── edit/page.tsx   — EDIT SCHOOL
│       │
│       ├── products/
│       │   ├── page.tsx            — PRODUCTS LIST: CRUD, reorder, size group assignment
│       │   ├── loading.tsx
│       │   └── error.tsx
│       │
│       ├── prices/
│       │   ├── page.tsx            — PRICE MATRIX: grouped by school>product, CRUD, filter
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   └── bulk/page.tsx       — BULK PRICE ENTRY (spreadsheet-style grid)
│       │
│       ├── bills/
│       │   ├── page.tsx            — BILLS LIST: search, date filter, pagination, voided toggle
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   ├── new/page.tsx        — NEW BILL: Full POS-style bill creation + payment methods
│       │   └── [id]/
│       │       ├── page.tsx        — BILL DETAIL: Receipt view, UPI QR code, payment breakdown
│       │       ├── print-button.tsx         — Browser print (window.print())
│       │       ├── thermal-print-button.tsx  — Bluetooth thermal printer button
│       │       ├── edit-bill-button.tsx      — Opens edit panel
│       │       ├── edit-bill-panel.tsx       — Full bill editing
│       │       ├── mark-paid-button.tsx      — Toggle paid/unpaid status + auto-print
│       │       └── void-bill-button.tsx      — Void bill (restores stock)
│       │
│       ├── inventory/
│       │   ├── page.tsx            — INVENTORY: Stock view, add entries
│       │   ├── loading.tsx
│       │   └── error.tsx
│       │
│       ├── suppliers/
│       │   ├── page.tsx            — SUPPLIERS: CRUD management
│       │   ├── loading.tsx
│       │   └── error.tsx
│       │
│       └── settings/
│           ├── page.tsx            — Size groups, UPI ID, printer, shop details, team/roles
│           ├── loading.tsx
│           └── error.tsx
│
├── components/
│   ├── ui/                         — shadcn/ui components (button, card, dialog, input, select, etc.)
│   ├── sidebar.tsx                 — Dashboard sidebar navigation
│   ├── printer-dialog.tsx          — Bluetooth printer connect/disconnect dialog
│   └── auto-print-handler.tsx      — Client component for ?autoprint auto-trigger
│
├── lib/
│   ├── thermal-printer.ts          — ESC/POS receipt generation + Web Bluetooth + auto-print
│   ├── amount-to-words.ts          — ₹ amount to Indian English words (lakhs/crores)
│   ├── cart.ts                     — Client-side shopping cart (localStorage)
│   ├── utils.ts                    — cn() helper (clsx + tailwind-merge)
│   └── supabase/
│       ├── client.ts               — Browser Supabase client
│       ├── server.ts               — Server-side Supabase client (cookie-based)
│       └── middleware.ts           — Session refresh helper
│
├── types/
│   └── web-bluetooth.d.ts          — Web Bluetooth API type declarations
│
└── proxy.ts                        — Next.js 16 proxy (session refresh)
```

---

## Database Schema (PostgreSQL via Supabase)

### `schools`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| short_code | TEXT | "DAV", "KV" for quick search, pg_trgm indexed |
| address | TEXT | |
| phone | TEXT | |
| is_active | BOOLEAN | Default: true |
| created_by | UUID FK -> auth.users | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | pg_trgm indexed |
| category | TEXT | uniform/shoes/accessories/other |
| sort_order | INT | Dropdown priority |
| current_stock | INT | Default: 0 |
| low_stock_threshold | INT | Default: 0 |
| hsn_code | TEXT | For GST |
| size_group_id | UUID FK -> size_groups | Nullable |
| created_at | TIMESTAMPTZ | |

### `sizes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| label | TEXT NOT NULL | "28", "32", "M", "L" |
| numeric_value | NUMERIC | For sorting |
| created_at | TIMESTAMPTZ | |

### `size_groups`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | "FULL SHIRT", "SKIRT" |
| sort_order | NUMERIC | |
| created_at | TIMESTAMPTZ | |

### `size_group_items` (junction)
| Column | Type | Notes |
|--------|------|-------|
| size_group_id | UUID FK -> size_groups | Composite PK |
| size_id | UUID FK -> sizes | Composite PK |
| sort_order | NUMERIC | |

### `price_list` (THE PRICE MATRIX)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| school_id | UUID FK -> schools | CASCADE delete |
| product_id | UUID FK -> products | CASCADE delete |
| size_id | UUID FK -> sizes | Nullable (for non-sized products) |
| price | NUMERIC(10,2) NOT NULL | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (school_id, product_id, size_id) | Partial indexes for sized + unsized |

### `bills`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| bill_number | TEXT UNIQUE NOT NULL | Auto-generated: NY-{YEAR}-{0001} |
| customer_name | TEXT | |
| customer_phone | TEXT | Indexed for search |
| school_id | UUID FK -> schools | SET NULL on delete |
| subtotal | NUMERIC(10,2) | |
| discount | NUMERIC(10,2) | Bill-level discount |
| total | NUMERIC(10,2) | |
| payment_method | TEXT | cash/upi/card/credit/split |
| payment_details | JSONB | Split payment breakdown, e.g. `[{"method":"cash","amount":300}]` |
| notes | TEXT | |
| is_paid | BOOLEAN | Default: true |
| paid_at | TIMESTAMPTZ | |
| status | TEXT | active/voided |
| voided_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `bill_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| bill_id | UUID FK -> bills | CASCADE delete |
| product_id | UUID FK -> products | SET NULL |
| size_id | UUID FK -> sizes | SET NULL |
| product_name | TEXT NOT NULL | Snapshot at sale time |
| size_label | TEXT | Snapshot at sale time |
| qty | INT | |
| price | NUMERIC(10,2) | Unit price |
| subtotal | NUMERIC(10,2) | Line total after item discount |
| discount_type | TEXT | none/flat/percent |
| discount_value | NUMERIC(10,2) | |
| discount_amount | NUMERIC(10,2) | |
| created_at | TIMESTAMPTZ | |

### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| phone | TEXT | |
| address | TEXT | |
| created_at | TIMESTAMPTZ | |

### `inventory`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| product_id | UUID FK -> products | CASCADE |
| size_id | UUID FK -> sizes | SET NULL |
| supplier_id | UUID FK -> suppliers | SET NULL |
| quantity | INT | Negative for returns |
| purchase_price | NUMERIC(10,2) | Per-unit cost |
| entry_type | TEXT | purchase/adjustment/return |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

### `shop_config` (key-value store)
Keys: `upi_id`, `legal_name`, `shop_address`, `shop_phone`, `gstin`, `state_name`, `state_code`, `shop_tagline`, `tax_type`

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK FK -> auth.users | |
| role | TEXT | owner/staff |
| display_name | TEXT | |
| created_at | TIMESTAMPTZ | |

### Views
- `current_stock` — Aggregates SUM(quantity) from inventory

### Functions
- `generate_bill_number()` — Returns NY-{YEAR}-{4-digit sequence}
- `decrement_stock(p_product_id, p_qty)` — Atomically decrements
- `increment_stock(p_product_id, p_qty)` — Atomically increments

---

## Thermal Printer System

### How It Works
- Uses **Web Bluetooth API** to connect directly from the browser to ESC/POS thermal printers
- Only works in **Chrome/Edge** (requires Web Bluetooth)
- No driver installation needed on macOS/Linux; Windows may need WinUSB (Zadig)
- 80mm (48 chars) or 58mm (32 chars) — configurable in printer dialog

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/thermal-printer.ts` | Core library: ESC/POS commands, receipt generation, Web Bluetooth connection, chunked BLE writes, auto-reconnect, printBillById |
| `src/components/printer-dialog.tsx` | Connection dialog with CONNECT/DISCONNECT buttons, paper width selector, auto-reconnect on mount |
| `src/components/auto-print-handler.tsx` | Client component that checks for `?autoprint=true` URL param and triggers thermal print |
| `src/app/(dashboard)/bills/[id]/thermal-print-button.tsx` | "THERMAL" button on bill detail page (manual print) |
| `src/app/(dashboard)/bills/[id]/mark-paid-button.tsx` | Marks bill paid + auto-prints receipt |
| `src/types/web-bluetooth.d.ts` | Type declarations for Web Bluetooth API |

### Auto-Print Flow
| Trigger | Mechanism |
|---------|-----------|
| Save cash/UPI/card bill | Redirects to `/bills/[id]?autoprint=true` → `AutoPrintHandler` detects param → prints |
| Click "MARK PAID" | `MarkPaidButton` calls `generateReceipt()` + `printReceipt()` directly |
| Click "THERMAL" button | Manual print (unchanged from initial implementation) |

### Receipt Format
```
      BILL OF SUPPLY
     NANDALAYA
  SCHOOL UNIFORMS & GARMENTS
  [address]
  GSTIN: ...
  Mob. ...
----------------------------------------
Bill: NY-2026-0001
Date: 06 Jul 2026 02:30 PM
Customer: ...
Phone: ...
----------------------------------------
Item             Qty   Total
----------------------------------------
Shirt(32)          2    ₹500
  @₹250
----------------------------------------
Subtotal:          ₹500
TOTAL:             ₹500
----------------------------------------
Payment: CASH

Amount in words:
FIVE HUNDRED RUPEES ONLY
----------------------------------------
      THANK YOU!

Auth. Sign: __________________
```

### Functions in thermal-printer.ts
- `generateReceipt(bill, items, shop?, lineWidth?)` — Returns ESC/POS string
- `connectToPrinter(onStatus?)` — Opens browser Bluetooth device chooser, connects
- `tryReconnect(onStatus?)` — Auto-reconnects to previously paired printer via `navigator.bluetooth.getDevices()`
- `isPrinterConnected()` — Returns boolean
- `disconnectPrinter()` — Disconnects and clears state
- `printReceipt(receiptText, onStatus?)` — Sends ESC/POS bytes to printer (chunked BLE writes)
- `printBillById(billId, onStatus?)` — Fetches bill + items from Supabase, generates receipt, prints
- `getStoredLineWidth()` / `setStoredLineWidth(width)` — Gets/sets 32 or 48 chars (persisted in localStorage)

---

## Payment Flow

### Cash
1. Create bill with payment_method = "cash" → is_paid = true immediately
2. Redirect to bill detail with `?autoprint=true`
3. Auto-print receipt (if printer connected)

### UPI
1. Create bill with payment_method = "upi" → is_paid = true immediately
2. Bill detail page shows `upi://pay` QR code with exact amount and bill reference
3. Customer scans with PhonePe/GPay/Paytm
4. Bill is already marked paid — no extra action needed
5. Receipt auto-prints

### Card (manual entry)
1. Create bill with payment_method = "card" → is_paid = true immediately
2. Cashier enters card amount on external card machine (if any)
3. Bill is already marked paid
4. Receipt auto-prints

### Credit
1. Create bill with payment_method = "credit" → is_paid = false
2. No auto-print
3. When customer returns to pay → cashier clicks "MARK PAID"
4. Bill marked paid + receipt auto-prints

### Split
1. Create bill with payment_method = "split" → partially paid
2. payment_details JSONB array: [{method, amount}, ...]
3. If any portion is "credit", is_paid = false
4. When full payment received → "MARK PAID" → auto-print

---

## Coding Conventions

- **Language:** English only (no Hindi/localization)
- **Styling:** Tailwind CSS v4 utility classes + shadcn/ui components
- **Colors:** Green (#00592B) primary, Pink (#E374C7) accent, Blue (#0023D1) tertiary, Red (#C42424) danger
- **Typography:** Oswald font (Google Fonts), uppercase, bold, condensed
- **State:** React useState + Supabase queries (no Redux/Zustand)
- **Forms:** Simple controlled components + react-hook-form + Zod validation
- **Error handling:** Toast notifications (sonner), no error modals
- **Mobile:** All screens work on phones (320px+)
- **No API routes:** All data operations go through Supabase client directly (client-side) or server client (server-side)
- **Auth:** Supabase email/password, RLS = "authenticated full access" on all tables

---

## Dependencies

**Production:**
- next, react, react-dom
- @supabase/supabase-js, @supabase/ssr
- @base-ui/react
- react-hook-form, @hookform/resolvers, zod
- lucide-react (icons)
- qrcode (UPI QR generation)
- sonner (toasts)
- next-themes
- clsx, tailwind-merge, class-variance-authority
- tw-animate-css

**Dev:**
- typescript, @types/react, @types/react-dom, @types/node, @types/qrcode
- eslint, eslint-config-next
- tailwindcss, @tailwindcss/postcss

---

## Build Commands

```bash
npm run dev     # Development server (http://localhost:3000)
npm run build   # Production build (type-checks included)
npm run lint    # ESLint
npm run start   # Production start
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Store in `.env.local`. Never commit secrets.

---

## What Was Tested / Status

- ✅ School CRUD
- ✅ Product CRUD with size groups
- ✅ Size groups + sizes
- ✅ Price matrix (single + bulk entry)
- ✅ Bill creation with items, discounts, split payments
- ✅ UPI QR code generation on bill detail
- ✅ Browser print (window.print)
- ✅ Bluetooth thermal printer (ESC/POS via Web Bluetooth)
- ✅ Auto-print on cash creation
- ✅ Auto-print on mark-paid
- ✅ Printer auto-reconnect
- ✅ Printer paper width config (58mm/80mm)
- ✅ Void bill with stock restoration
- ✅ Inventory tracking
- ✅ Supplier management
- ✅ Dashboard (revenue, closing, top products, stock alerts)
- ✅ Universal search
- ✅ Settings (UPI ID, shop details, printer, size groups, team roles)
- ⬜ Print preview component
- ⬜ Barcode scanning
- ⬜ Customer purchase history
- ⬜ Pending orders tracking
- ⬜ Analytics
