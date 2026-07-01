-- Phase 10: Payment tracking + stock alerts + product categories + roles
-- Safe to run multiple times (idempotent)

-- Payment tracking on bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
-- Credit bills are unpaid by default
UPDATE bills SET is_paid = false, paid_at = NULL WHERE payment_method = 'credit' AND paid_at IS NULL;

-- Stock alerts: low_stock_threshold on products + current_stock tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT 0;

-- Product categories (enum-like via CHECK constraint)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'uniform';
ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category IN ('uniform', 'shoes', 'accessories', 'other'));

-- User roles: owner vs staff
ALTER TABLE schools ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
-- We'll store role in a profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'profiles') THEN
    CREATE POLICY "Authenticated full access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;
