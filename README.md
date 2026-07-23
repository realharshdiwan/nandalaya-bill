# Nandalaya — School Uniform & Garment POS

A POS/billing app for a small school uniform & garment shop in India.

**Shop:** Nandalaya (school uniforms & garments), 2-3 staff (non-technical)  
**Tech:** Next.js 16 (App Router) + Supabase + shadcn/ui v4 + Tailwind CSS v4  
**Hosting:** Vercel  

## Getting Started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build (type-checks included)
npm run lint      # ESLint
```

## Hardware Setup

- **Tablet/Phone:** Runs the POS web app, shows UPI QR codes
- **Printer:** Bluetooth thermal printer (ESC/POS) via Web Bluetooth on Chrome/Edge

See `AGENTS.md` for full architecture docs.
