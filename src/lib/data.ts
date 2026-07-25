import { createClient } from "@/lib/supabase/client";
import db, { type PriceEntry, type School, type Product, type Size, type SizeGroup } from "@/lib/db";
import { syncAll, flushOfflineQueue } from "@/lib/sync";

let initialSyncDone = false;

export async function initData() {
  if (initialSyncDone) return;
  initialSyncDone = true;
  if (navigator.onLine) {
    await syncAll();
    await flushOfflineQueue();
  }
}

export function onOnline(callback: () => void) {
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}

// ── Schools ──

export async function getSchools(): Promise<School[]> {
  const cached = await db.schools.toArray();
  return cached.filter((s) => s.is_active).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSchool(id: string): Promise<School | null> {
  return (await db.schools.get(id)) || null;
}

// ── Products ──

export async function getProducts(): Promise<Product[]> {
  return db.products.toArray();
}

// ── Sizes ──

export async function getSizes(): Promise<Size[]> {
  return db.sizes.toArray();
}

export async function getSizeGroups(): Promise<SizeGroup[]> {
  const cached = await db.size_groups.toArray();
  const items = await db.size_group_items.toArray();
  if (cached.length === 0) return [];
  const sizes = await db.sizes.toArray();
  return cached.map((g) => ({
    ...g,
    sizes: items
      .filter((i) => i.size_group_id === g.id)
      .map((i) => sizes.find((s) => s.id === i.size_id))
      .filter(Boolean) as Size[],
  }));
}

// ── Prices ──

async function enrichPrices(prices: PriceEntry[]) {
  const products = await getProducts();
  const allSizes = await getSizes();
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const sizeMap = Object.fromEntries(allSizes.map((s) => [s.id, s]));

  return prices.map((p) => {
    const product = productMap[p.product_id];
    const size = p.size_id ? sizeMap[p.size_id] : null;
    return {
      ...p,
      products: product || null,
      sizes: size || null,
    };
  });
}

export async function getPricesForSchool(schoolId: string) {
  const schoolPrices = await db.price_list
    .where("school_id")
    .equals(schoolId)
    .toArray();

  const school = await db.schools.get(schoolId);
  const groupId = school?.school_group_id;
  const groupPrices = groupId
    ? await db.price_list.where("school_group_id").equals(groupId).toArray()
    : [];

  const schoolKeys = new Set(schoolPrices.map((p) => `${p.product_id}-${p.size_id || ""}`));
  const merged = [
    ...schoolPrices,
    ...groupPrices.filter((p) => !schoolKeys.has(`${p.product_id}-${p.size_id || ""}`)),
  ];

  return enrichPrices(merged);
}

export async function getPricesForGroup(groupId: string) {
  const prices = await db.price_list.where("school_group_id").equals(groupId).toArray();
  return enrichPrices(prices);
}

// ── Bills ──

export async function getBills(options?: { limit?: number; schoolId?: string }) {
  let cached = await db.bills.orderBy("created_at").reverse().toArray();
  if (options?.schoolId) {
    cached = cached.filter((b: any) => b.school_id === options.schoolId);
  }
  if (options?.limit) {
    cached = cached.slice(0, options.limit);
  }
  return cached;
}

export async function getBill(id: string) {
  const cached = await db.bills.get(id);
  if (!cached) return null;
  const items = await db.bill_items.where("bill_id").equals(id).toArray();
  return { bill: cached, items };
}

// ── Shop config ──

export async function getShopConfig(key: string): Promise<string | null> {
  const cached = await db.shop_config.get(key);
  return cached?.value ?? null;
}

export async function getShopConfigAll(): Promise<Record<string, string>> {
  const cached = await db.shop_config.toArray();
  if (cached.length === 0) return {};
  return Object.fromEntries(cached.map((r) => [r.key, r.value]));
}

// ── School Groups ──

export async function getSchoolGroups() {
  const supabase = createClient();
  const { data } = await supabase.from("school_groups").select("*").order("sort_order");
  return data || [];
}

export async function getPriceEntries() {
  const supabase = createClient();
  const { data } = await supabase
    .from("price_list")
    .select(`id, school_id, school_group_id, product_id, size_id, price,
      schools!left(id, name, short_code),
      school_groups!left(id, name),
      products(id, name, category),
      sizes(id, label, numeric_value)`)
    .eq("is_active", true);

  return ((data as any[]) || []).map((row: any) => ({
    ...row,
    schools: row.schools ? (Array.isArray(row.schools) ? row.schools[0] : row.schools) : null,
    school_groups: row.school_groups ? (Array.isArray(row.school_groups) ? row.school_groups[0] : row.school_groups) : null,
    products: Array.isArray(row.products) ? row.products[0] : row.products,
    sizes: row.sizes ? (Array.isArray(row.sizes) ? row.sizes[0] : row.sizes) : null,
  }));
}

// ── Search (client-side, works offline) ──

export async function searchSchools(term: string): Promise<School[]> {
  const schools = await getSchools();
  if (!term.trim()) return schools.slice(0, 5);
  const q = term.toLowerCase();
  return schools
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.short_code || "").toLowerCase().includes(q)
    )
    .slice(0, 5);
}

export async function searchProducts(term: string): Promise<Product[]> {
  const products = await getProducts();
  if (!term.trim()) return [];
  const q = term.toLowerCase();
  return products
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 5);
}

export async function searchPrices(term: string): Promise<any[]> {
  if (!term.trim()) return [];
  const q = term.toLowerCase();
  const schools = await getSchools();
  const products = await getProducts();

  const priceList = await db.price_list.toArray();
  const schoolMap = Object.fromEntries(schools.map((s) => [s.id, s]));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const sizes = await getSizes();
  const sizeMap = Object.fromEntries(sizes.map((s) => [s.id, s]));

  const results = [];
  for (const p of priceList) {
    if (!p.is_active) continue;
    const school = p.school_id ? schoolMap[p.school_id] : null;
    const product = p.product_id ? productMap[p.product_id] : null;
    const size = p.size_id ? sizeMap[p.size_id] : null;
    if (!product) continue;

    const schoolStr = school ? `${school.name} ${school.short_code || ""}` : "";
    const productStr = product.name;
    const sizeStr = size ? size.label : "";
    const haystack = `${schoolStr} ${productStr} ${sizeStr}`.toLowerCase();

    if (!haystack.includes(q)) continue;

    results.push({
      id: p.id,
      price: p.price,
      school: school || null,
      product,
      size,
      schoolName: school?.name || "",
      schoolCode: school?.short_code || "",
      productName: product.name,
      sizeLabel: size?.label || "",
    });
  }

  return results.slice(0, 10);
}

// ── Sizes for product ──

export async function getSizesForProduct(productId: string): Promise<Size[]> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product?.size_group_id) return [];

  const groupItems = await db.size_group_items
    .where("size_group_id")
    .equals(product.size_group_id)
    .sortBy("sort_order");

  const sizes = await db.sizes.toArray();
  return groupItems
    .map((gi) => sizes.find((s) => s.id === gi.size_id))
    .filter(Boolean) as Size[];
}

// ── Offline-first bill creation ──

function nextLocalBillNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
  const time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const suffix = `${String(dayOfYear).padStart(3, "0")}${String(time).padStart(5, "0")}`;
  return `NY-${year}-${suffix}`;
}

export async function generateBillNumber(): Promise<string | null> {
  const year = new Date().getFullYear();
  const lastStored = await db.shop_config.get("last_bill_number");
  let seq = 9000;
  if (lastStored) {
    const match = lastStored.value.match(/NY-(\d{4})-(\d{4})/);
    if (match) {
      const lastYear = parseInt(match[1]);
      const lastSeq = parseInt(match[2]);
      if (lastYear === year) {
        seq = lastSeq + 1;
      }
    }
  }
  const formatted = `NY-${year}-${String(seq).padStart(4, "0")}`;
  await db.shop_config.put({ key: "last_bill_number", value: formatted });

  // Background refresh from Supabase RPC when online
  if (navigator.onLine) {
    const supabase = createClient();
    supabase.rpc("generate_bill_number").then(({ data }) => {
      if (data) {
        db.shop_config.put({ key: "last_bill_number", value: data });
      }
    });
  }

  return formatted;
}

export async function decrementStock(productId: string, qty: number) {
  if (navigator.onLine) {
    try {
      const supabase = createClient();
      await supabase.rpc("decrement_stock", { p_product_id: productId, p_qty: qty });
    } catch {
      // best-effort
    }
  }
}

async function addOfflineQueue(billData: any, itemRows: any[]) {
  await db.offline_queue.add({
    table: "bills",
    action: "insert",
    data: billData,
    created_at: new Date().toISOString(),
  });
  for (const item of itemRows) {
    await db.offline_queue.add({
      table: "bill_items",
      action: "insert",
      data: item,
      created_at: new Date().toISOString(),
    });
  }
}

async function syncBillToSupabase(billData: any, itemRows: any[]) {
  try {
    const supabase = createClient();
    const { error: billError } = await supabase.from("bills").insert(billData);
    if (billError) throw billError;
    const items = itemRows.map(({ id: _id, ...rest }: any) => rest);
    const { error: itemsError } = await supabase.from("bill_items").insert(items);
    if (itemsError) {
      await supabase.from("bills").delete().eq("id", billData.id);
      throw itemsError;
    }
    await db.bills.update(billData.id, { synced: 1 });
  } catch {
    await addOfflineQueue(billData, itemRows);
  }
}

export async function createBillOffline(bill: any, items: any[]) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const itemRows = items.map((item, i) => ({
    ...item,
    id: `${id}-item-${i}`,
    bill_id: id,
    created_at: now,
  }));

  const billData = {
    ...bill,
    id,
    synced: 0,
    created_at: bill.created_at || now,
  };

  await db.bills.put(billData);
  await db.bill_items.bulkAdd(itemRows);

  if (navigator.onLine) {
    syncBillToSupabase(billData, itemRows);
  } else {
    await addOfflineQueue(billData, itemRows);
  }

  return billData;
}
