# Nandalaya — AI Agent Rules

## Project Overview
School uniform & garment business management app.
- **Stack:** Next.js 16 (App Router) + Supabase + shadcn/ui + Tailwind CSS v4
- **Users:** 2-3 shop staff (non-technical)
- **Philosophy:** Apple-like simplicity. Fewer screens, fewer buttons, less training.

## Critical Next.js 16 Changes

### Proxy (NOT middleware)
- Next.js 16 renamed `middleware.ts` → `proxy.ts`
- Export `proxy` function, not `middleware`
- File lives in project root (or `src/`)

### Server Components (Default)
- All components are Server Components by default
- Add `"use client"` ONLY when you need `useState`, `useEffect`, event handlers, or browser APIs

### Dynamic Route Params
- `params` is now a `Promise` — must `await` it:
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
// row.schools is an array, not an object
const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
```

## File Structure
```
src/
├── app/
│   ├── (auth)/login/     — Login page
│   ├── (dashboard)/      — Protected pages (sidebar layout)
│   │   ├── page.tsx      — Home (search)
│   │   ├── schools/      — Schools CRUD
│   │   ├── products/     — Products list
│   │   ├── prices/       — Price matrix management
│   │   └── settings/     — Sizes, config
│   └── auth/callback/    — OAuth callback
├── components/
│   ├── ui/               — shadcn/ui components
│   └── sidebar.tsx       — Dashboard sidebar
└── lib/
    ├── supabase/
    │   ├── client.ts     — Browser client
    │   ├── server.ts     — Server client
    │   └── middleware.ts — Session refresh helper
    └── utils.ts          — cn() helper
```

## Coding Conventions
- **Language:** English only (no Hindi/localization for now)
- **Styling:** Tailwind CSS classes + shadcn/ui components
- **Colors:** Warm saffron/amber theme (orange-600 primary)
- **State:** React useState + Supabase queries (no Redux/Zustand)
- **Forms:** Simple controlled components or react-hook-form
- **Error handling:** Display errors inline, not modals
- **Mobile:** All screens must work on phones (320px+)

## Database Tables
- `schools` — School info (name, short_code, is_active)
- `products` — Product catalog (name, category)
- `sizes` — Available sizes (label, numeric_value for sorting)
- `price_list` — THE PRICE MATRIX (school_id + product_id + size_id = price)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Build Commands
```bash
npm run dev     # Development server
npm run build   # Production build (type-checks included)
npm run lint    # ESLint
```
