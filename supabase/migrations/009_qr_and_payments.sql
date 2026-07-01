-- Phase 9: UPI QR payments + split payments
-- Safe to run multiple times (idempotent)

-- Shop configuration table (UPI ID, shop name, etc.)
CREATE TABLE IF NOT EXISTS shop_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: authenticated users can do everything
ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated full access' AND tablename = 'shop_config') THEN
    CREATE POLICY "Authenticated full access" ON shop_config FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Seed default UPI ID (empty — shop owner sets it in Settings)
INSERT INTO shop_config (key, value) VALUES ('upi_id', '') ON CONFLICT (key) DO NOTHING;

-- Payment breakdown for split payments (cash + UPI + credit on same bill)
-- Example: [{"method":"cash","amount":300},{"method":"upi","amount":230}]
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_details JSONB;
