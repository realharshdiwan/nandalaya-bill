# Nandalaya — Product Specification

## What Is This?

Nandalaya replaces paper price books, manual billing, and memory-dependent operations with a simple digital system for a school uniform & garment shop.

**Target users:** Shop owner, family members, 2-3 staff (non-technical).  
**Philosophy:** Apple-like simplicity. Fewer screens, fewer buttons, less training.  
**Hardware:** Tablet/phone running the web app + Bluetooth thermal printer.

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
| Printing | ESC/POS via Web Bluetooth API |

### Critical Next.js 16 Conventions

- **Proxy, not middleware:** `proxy.ts` in project root, exports `proxy` function
- **Server Components by default:** Add `"use client"` only for useState/useEffect/event handlers
- **Async params:** `params` is a `Promise` — must `await params`
- **base-ui Dialog:** Use `render` prop, NOT `asChild`
- **base-ui Select:** `onValueChange` receives `(value: string \| null)`
- **Supabase joins return arrays:** Always normalize with `Array.isArray(x) ? x[0] : x`

---

## Pages & Routes

| Page | Route | Type | Purpose |
|------|-------|------|---------|
| Login | `/login` | Client | Email/password sign in |
| Home | `/` | Client | Universal search (schools, products, prices, bills) |
| Dashboard | `/dashboard` | Server | Revenue, today's closing, top products, stock alerts |
| Schools | `/schools` | Server | List all schools |
| School Detail | `/schools/[id]` | Server | Prices per school + shopping cart |
| New School | `/schools/new` | Client | Add school |
| Edit School | `/schools/[id]/edit` | Client | Edit school |
| Products | `/products` | Server | Product list with reorder, size groups |
| Prices | `/prices` | Client | Price matrix by school |
| Bulk Prices | `/prices/bulk` | Client | Spreadsheet-style bulk price entry |
| Bills | `/bills` | Server | Bills list, search, date filter, pagination |
| New Bill | `/bills/new` | Client | Full POS bill creation |
| Bill Detail | `/bills/[id]` | Server | Receipt, UPI QR, payment, print, void |
| Inventory | `/inventory` | Server | Stock view, purchase/adjustment/return entries |
| Suppliers | `/suppliers` | Server | Supplier CRUD |
| Settings | `/settings` | Client | UPI ID, shop config, printer, size groups, roles |

---

## Design Language

- **Brand colors:** Deep green (#00592B), hot pink (#E374C7), cobalt blue (#0023D1), red (#C42424)
- **Typography:** Oswald (Google Fonts), uppercase, bold, condensed
- **Surfaces:** White cards with 4px black borders, 20px radius, hard offset shadows
- **Buttons:** Skewed white blocks with hard black shadows that grow on hover
- **Mobile-first:** All screens work on 320px+ phones
- See `SKILL.md` for full design token definitions and component specs

---

## Payment Flow

- **Cash:** Bill created → mark paid immediately → auto-print
- **UPI:** Bill created → shows `upi://pay` QR with exact amount → customer scans with any UPI app (PhonePe, GPay, Paytm) → bill already marked paid → auto-print
- **Card:** Bill created → paid immediately (manual entry, external card machine if any) → auto-print
- **Credit:** Bill created unpaid → customer returns → cashier clicks "MARK PAID" → auto-print
- **Split:** Any combination of cash/UPI/credit with payment_details JSONB

---

## Auto-Print System

| Trigger | What prints | How |
|---------|-------------|-----|
| Save cash/UPI/card bill | Receipt | `?autoprint=true` redirect → `AutoPrintHandler` |
| Click MARK PAID | Receipt | `MarkPaidButton` generates + prints |
| Click THERMAL button | Receipt | Manual trigger |

If printer is not connected, a toast prompts the user to connect.

---

## Build Commands

```bash
npm run dev     # Development (http://localhost:3000)
npm run build   # Production build (type-checks)
npm run lint    # ESLint
npm run start   # Production start
```

---

## Future Roadmap

| Feature | Status |
|---------|--------|
| School CRUD | DONE |
| Product CRUD + size groups | DONE |
| Price matrix (single + bulk) | DONE |
| Bill creation (POS-style) | DONE |
| UPI QR generation | DONE |
| Bluetooth thermal printing | DONE |
| Auto-print on save + mark-paid | DONE |
| Printer reconnect + paper width | DONE |
| Void bill (stock restore) | DONE |
| Dashboard stats | DONE |
| Universal search | DONE |
| Inventory tracking | DONE |
| Supplier management | DONE |
| Settings (shop, printer, roles) | DONE |
| Print preview | PLANNED |
| Barcode scanning | PLANNED |
| Customer purchase history | PLANNED |
| Pending orders tracking | PLANNED |
| Analytics | FUTURE |
