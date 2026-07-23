-- Size Groups: organize sizes into custom-named groups
-- A size can belong to multiple groups (e.g., "28" in both "FULL SHIRT" and "SKIRT")
-- Products reference one size group (or NULL for no-size products)

-- 1. Size groups table
CREATE TABLE IF NOT EXISTS size_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Junction: which sizes belong to each group
CREATE TABLE IF NOT EXISTS size_group_items (
  size_group_id UUID NOT NULL REFERENCES size_groups(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  sort_order NUMERIC DEFAULT 0,
  PRIMARY KEY (size_group_id, size_id)
);

-- 3. Add size_group_id to products
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN size_group_id UUID REFERENCES size_groups(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_size_group_items_group ON size_group_items(size_group_id);
CREATE INDEX IF NOT EXISTS idx_products_size_group ON products(size_group_id);

-- 5. RLS
ALTER TABLE size_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_group_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'size_groups') THEN
    CREATE POLICY "Authenticated full access" ON size_groups FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'size_group_items') THEN
    CREATE POLICY "Authenticated full access" ON size_group_items FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;
