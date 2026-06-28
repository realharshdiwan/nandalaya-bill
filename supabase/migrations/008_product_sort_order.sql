-- Phase 8: Product sort_order for billing priority
-- Lower sort_order = appears first in billing dropdown
-- Safe to run multiple times (idempotent)

ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Index for fast sorted queries
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order, name);
