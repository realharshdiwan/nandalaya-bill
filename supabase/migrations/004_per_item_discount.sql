-- Per-item discount support + bill number sequence
-- Safe to run multiple times

-- Add discount columns to bill_items
DO $$ BEGIN
  ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
