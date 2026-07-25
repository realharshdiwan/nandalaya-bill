import Dexie, { type EntityTable } from "dexie";

export interface School {
  id: string;
  name: string;
  short_code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean | number;
  school_group_id: string | null;
  created_by: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  current_stock: number;
  low_stock_threshold: number;
  hsn_code: string | null;
  size_group_id: string | null;
}

export interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

export interface SizeGroup {
  id: string;
  name: string;
  sort_order: number;
  sizes: Size[];
}

export interface SizeGroupItem {
  id?: number;
  size_group_id: string;
  size_id: string;
  sort_order: number;
}

export interface PriceEntry {
  id: string;
  school_id: string | null;
  school_group_id: string | null;
  product_id: string;
  size_id: string | null;
  price: number;
  is_active: boolean | number;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  school_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_details: unknown;
  notes: string | null;
  is_paid: boolean;
  status: string;
  created_at: string;
  synced: number;
}

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string | null;
  size_id: string | null;
  product_name: string;
  size_label: string | null;
  qty: number;
  price: number;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

export interface ShopConfig {
  key: string;
  value: string;
}

export interface OfflineQueue {
  id?: number;
  table: string;
  action: "insert" | "update" | "delete";
  data: unknown;
  created_at: string;
}

const db = new Dexie("NandalayaDB") as Dexie & {
  schools: EntityTable<School, "id">;
  products: EntityTable<Product, "id">;
  sizes: EntityTable<Size, "id">;
  size_groups: EntityTable<SizeGroup, "id">;
  size_group_items: EntityTable<SizeGroupItem, "id">;
  price_list: EntityTable<PriceEntry, "id">;
  bills: EntityTable<Bill, "id">;
  bill_items: EntityTable<BillItem, "id">;
  shop_config: EntityTable<ShopConfig, "key">;
  offline_queue: EntityTable<OfflineQueue, "id">;
};

db.version(1).stores({
  schools: "id, name, school_group_id, is_active",
  products: "id, name, category, size_group_id",
  sizes: "id, label, numeric_value",
  size_groups: "id, name",
  size_group_items: "[size_group_id+size_id], size_group_id, size_id, sort_order",
  price_list: "id, school_id, school_group_id, product_id, size_id, is_active",
  bills: "id, bill_number, school_id, status, created_at, synced",
  bill_items: "id, bill_id, product_id",
  shop_config: "key",
  offline_queue: "++id, table, created_at",
});

export default db;
