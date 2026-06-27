-- Migration 006: Inventory + Suppliers
-- Run this in Supabase SQL Editor

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Inventory entries (stock in/out log)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID REFERENCES sizes(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  purchase_price NUMERIC(10,2),
  entry_type TEXT DEFAULT 'purchase' CHECK (entry_type IN ('purchase', 'adjustment', 'return')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_size ON inventory(size_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_created ON inventory(created_at);

-- Current stock view
CREATE OR REPLACE VIEW current_stock AS
SELECT
  product_id,
  size_id,
  SUM(quantity) as total_quantity,
  SUM(COALESCE(purchase_price, 0) * quantity) as total_value
FROM inventory
GROUP BY product_id, size_id;

-- RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON suppliers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');
