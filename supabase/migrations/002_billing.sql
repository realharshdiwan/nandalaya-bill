-- Phase 2: Billing
-- Safe to run multiple times (idempotent)

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bill line items
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  size_id UUID REFERENCES sizes(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size_label TEXT,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'bills') THEN
    CREATE POLICY "Authenticated full access" ON bills FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'bill_items') THEN
    CREATE POLICY "Authenticated full access" ON bill_items FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_school ON bills(school_id);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_phone ON bills(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);

-- Bill number sequence
CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1;

-- Function to generate next bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TEXT AS $$
DECLARE
  next_val INT;
  bill_num TEXT;
BEGIN
  next_val := nextval('bill_number_seq');
  bill_num := 'NY-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_val::TEXT, 4, '0');
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION generate_bill_number() TO authenticated;
