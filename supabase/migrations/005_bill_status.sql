-- Migration 005: Add bill status (active/voided)
-- Run this in Supabase SQL Editor

-- Add status column to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- RLS policies (already have authenticated full access, so no change needed)

-- Comments
COMMENT ON COLUMN bills.status IS 'Bill status: active or voided';
COMMENT ON COLUMN bills.voided_at IS 'Timestamp when bill was voided';
