-- Phase 11: Shop config, HSN codes, inventory billing integration

-- Extend shop_config with business details
ALTER TABLE shop_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Seed shop details for Saraswati Garments
INSERT INTO shop_config (key, value) VALUES
  ('legal_name', 'M/S. SARASWATI GARMENTS'),
  ('shop_address', 'Chowk Bazar, SAHIBGANJ-816109 (Jharkhand)'),
  ('shop_phone', '7870971433'),
  ('gstin', '20AYCPD3160A1ZK'),
  ('state_name', 'Jharkhand'),
  ('state_code', '20'),
  ('shop_tagline', 'SCHOOL UNIFORMS & GARMENTS'),
  ('tax_type', 'composite')
ON CONFLICT (key) DO NOTHING;

-- HSN codes on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- Stock tracking: function to decrement stock atomically
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET current_stock = GREATEST(0, current_stock - p_qty)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Stock tracking: function to increment stock atomically
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + p_qty
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
