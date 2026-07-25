-- Nandalaya: Clear all data for fresh start
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/ryhltvwitharelsumfem/sql/new)

-- Disable triggers temporarily for clean truncation
SET session_replication_role = 'replica';

-- Delete in dependency order
DELETE FROM bill_items;
DELETE FROM bills;
DELETE FROM price_list;
DELETE FROM inventory;
DELETE FROM size_group_items;
DELETE FROM size_groups;
DELETE FROM products;
DELETE FROM suppliers;
DELETE FROM schools;

-- Reset sequences if any
-- (no sequences in UUID-based schema, but just in case)
DELETE FROM sizes;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify
SELECT 'bill_items' AS tbl, count(*) FROM bill_items
UNION ALL SELECT 'bills', count(*) FROM bills
UNION ALL SELECT 'price_list', count(*) FROM price_list
UNION ALL SELECT 'inventory', count(*) FROM inventory
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'suppliers', count(*) FROM suppliers
UNION ALL SELECT 'schools', count(*) FROM schools
UNION ALL SELECT 'sizes', count(*) FROM sizes;
