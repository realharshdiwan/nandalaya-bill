-- Phase 7: Make size optional in price_list
-- For products like bags, ties, tiepins that don't have sizes
-- Safe to run multiple times (idempotent)

-- Make size_id nullable
ALTER TABLE price_list ALTER COLUMN size_id DROP NOT NULL;

-- Drop the old UNIQUE constraint (if it exists as a named constraint)
DO $$ BEGIN
  ALTER TABLE price_list DROP CONSTRAINT IF EXISTS price_list_school_id_product_id_size_id_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Partial unique index: for sized products (size_id IS NOT NULL)
-- One price per school × product × size
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_list_sized
  ON price_list(school_id, product_id, size_id)
  WHERE size_id IS NOT NULL;

-- Partial unique index: for non-sized products (size_id IS NULL)
-- One price per school × product
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_list_unsized
  ON price_list(school_id, product_id)
  WHERE size_id IS NULL;
