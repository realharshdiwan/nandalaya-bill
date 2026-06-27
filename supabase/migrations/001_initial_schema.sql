-- Nandalaya Database Schema
-- Safe to run multiple times (idempotent)

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Schools you serve
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products you sell
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'uniform',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sizes available
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  numeric_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- THE PRICE MATRIX
CREATE TABLE IF NOT EXISTS price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, product_id, size_id)
);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'schools') THEN
    CREATE POLICY "Authenticated full access" ON schools FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'products') THEN
    CREATE POLICY "Authenticated full access" ON products FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'sizes') THEN
    CREATE POLICY "Authenticated full access" ON sizes FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'price_list') THEN
    CREATE POLICY "Authenticated full access" ON price_list FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create indexes for fast search (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_schools_short_code ON schools USING gin(short_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_price_list_school ON price_list(school_id);
CREATE INDEX IF NOT EXISTS idx_price_list_product ON price_list(product_id);
CREATE INDEX IF NOT EXISTS idx_price_list_active ON price_list(is_active);
