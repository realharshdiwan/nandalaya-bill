import { createClient } from "@/lib/supabase/client";
import db, { type PriceEntry, type School, type Product, type Size, type SizeGroup } from "@/lib/db";
import { syncAll, syncPriceListForSchool, syncPricesForGroup, flushOfflineQueue } from "@/lib/sync";

let initialSyncDone = false;

export async function initData() {
  if (initialSyncDone) return;
  initialSyncDone = true;
  await syncAll();
  await flushOfflineQueue();
}

export function onOnline(callback: () => void) {
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}

// ── Schools ──

export async function getSchools(): Promise<School[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("schools").select("*").eq("is_active", true).order("name");
    if (data) {
      await db.schools.clear();
      await db.schools.bulkAdd(data as any[]);
      return data as School[];
    }
  }
  const cached = await db.schools.toArray();
  return cached.filter((s) => s.is_active).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSchool(id: string): Promise<School | null> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("schools").select("*").eq("id", id).single();
    if (data) {
      await db.schools.put(data as any);
      return data as School;
    }
  }
  return (await db.schools.get(id)) || null;
}

// ── Products ──

export async function getProducts(): Promise<Product[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("products").select("*").order("sort_order").order("name");
    if (data) {
      await db.products.clear();
      await db.products.bulkAdd(data as any[]);
      return data as Product[];
    }
  }
  return db.products.toArray();
}

// ── Sizes ──

export async function getSizes(): Promise<Size[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("sizes").select("*");
    if (data) {
      await db.sizes.clear();
      await db.sizes.bulkAdd(data as any[]);
      return data as Size[];
    }
  }
  return db.sizes.toArray();
}

export async function getSizeGroups(): Promise<SizeGroup[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const [groupsRes, itemsRes, sizesRes] = await Promise.all([
      supabase.from("size_groups").select("*").order("sort_order"),
      supabase.from("size_group_items").select("size_group_id, size_id, sort_order").order("sort_order"),
      supabase.from("sizes").select("*"),
    ]);

    if (groupsRes.data) { await db.size_groups.clear(); await db.size_groups.bulkAdd(groupsRes.data as any[]); }
    if (itemsRes.data) { await db.size_group_items.clear(); await db.size_group_items.bulkAdd(itemsRes.data as any[]); }
    if (sizesRes.data) { await db.sizes.clear(); await db.sizes.bulkAdd(sizesRes.data as any[]); }

    const allSizes = (sizesRes.data || []) as Size[];
    return ((groupsRes.data || []) as any[]).map((g) => ({
      ...g,
      sizes: ((itemsRes.data || []) as any[])
        .filter((i: any) => i.size_group_id === g.id)
        .map((i: any) => allSizes.find((s) => s.id === i.size_id))
        .filter(Boolean) as Size[],
    }));
  }

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
  if (navigator.onLine) {
    await syncPriceListForSchool(schoolId);
  }

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
  if (navigator.onLine) {
    await syncPricesForGroup(groupId);
  }
  const prices = await db.price_list.where("school_group_id").equals(groupId).toArray();
  return enrichPrices(prices);
}

// ── Bills ──

export async function createBill(bill: any, items: any[]) {
  const supabase = createClient();

  const { data: billData, error } = await supabase
    .from("bills")
    .insert(bill)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const billId = (billData as any).id;
  const billItems = items.map((item) => ({ ...item, bill_id: billId }));

  const { error: itemsError } = await supabase.from("bill_items").insert(billItems);
  if (itemsError) throw itemsError;

  await db.bills.put({ ...billData, synced: 1 } as any);
  await db.bill_items.bulkAdd(billItems);

  return billData;
}

export async function getBills(options?: { limit?: number; schoolId?: string }) {
  if (navigator.onLine) {
    const supabase = createClient();
    let supabaseQuery = supabase
      .from("bills")
      .select("*, bill_items(*)")
      .order("created_at", { ascending: false })
      .limit(options?.limit || 50);

    if (options?.schoolId) {
      supabaseQuery = supabaseQuery.eq("school_id", options.schoolId);
    }

    const { data } = await supabaseQuery;
    if (data) {
      await db.bills.clear();
      await db.bill_items.clear();
      const bills: any[] = [];
      const items: any[] = [];
      for (const row of data) {
        const itemRows = Array.isArray(row.bill_items) ? row.bill_items : [];
        bills.push({ ...row, bill_items: undefined, synced: 1 });
        for (const item of itemRows) {
          items.push(item);
        }
      }
      await db.bills.bulkAdd(bills);
      if (items.length > 0) await db.bill_items.bulkAdd(items);
      return bills;
    }
  }

  const cached = await db.bills.orderBy("created_at").reverse().limit(options?.limit || 50).toArray();
  return options?.schoolId
    ? cached.filter((b: any) => b.school_id === options.schoolId)
    : cached;
}

export async function getBill(id: string) {
  const cached = await db.bills.get(id);
  if (cached) {
    const items = await db.bill_items.where("bill_id").equals(id).toArray();
    return { bill: cached, items };
  }

  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from("bills")
      .select("*, bill_items(*)")
      .eq("id", id)
      .single();

    if (data) {
      const itemRows = Array.isArray((data as any).bill_items) ? (data as any).bill_items : [];
      const bill = { ...data, bill_items: undefined, synced: 1 } as any;
      await db.bills.put(bill);
      if (itemRows.length > 0) await db.bill_items.bulkAdd(itemRows);
      return { bill, items: itemRows };
    }
  }

  return null;
}

// ── Shop config ──

export async function getShopConfig(key: string): Promise<string | null> {
  const cached = await db.shop_config.get(key);
  if (cached) return cached.value;

  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("shop_config").select("value").eq("key", key).single();
    if (data) {
      await db.shop_config.put({ key, value: data.value });
      return data.value;
    }
  }
  return null;
}

export async function getShopConfigAll(): Promise<Record<string, string>> {
  const cached = await db.shop_config.toArray();
  if (cached.length > 0) return Object.fromEntries(cached.map((r) => [r.key, r.value]));

  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase.from("shop_config").select("key, value");
    if (data) {
      await db.shop_config.bulkAdd(data);
      return Object.fromEntries(data.map((r: any) => [r.key, r.value]));
    }
  }
  return {};
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

// ── Offline-friendly bill creation ──

export async function generateBillNumber(): Promise<string | null> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_bill_number");
    if (!error && data) return data;
  }
  return `OFFLINE-${Date.now().toString(36).toUpperCase()}`;
}

export async function decrementStock(productId: string, qty: number) {
  if (navigator.onLine) {
    try {
      const supabase = createClient();
      await supabase.rpc("decrement_stock", { p_product_id: productId, p_qty: qty });
    } catch {
      // stock decrement is best-effort
    }
  }
}

export async function createBillOffline(bill: any, items: any[]) {
  const supabase = createClient();

  if (navigator.onLine) {
    const { data: billData, error } = await supabase
      .from("bills")
      .insert(bill)
      .select()
      .single();

    if (error) throw error;

    const billId = (billData as any).id;
    const billItems = items.map((item) => ({ ...item, bill_id: billId }));

    const { error: itemsError } = await supabase.from("bill_items").insert(billItems);
    if (itemsError) {
      await supabase.from("bills").delete().eq("id", billId);
      throw itemsError;
    }

    await db.bills.put({ ...billData, synced: 1 } as any);
    await db.bill_items.bulkAdd(billItems);

    return billData;
  }

  const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const offlineBill = { ...bill, id: tempId, synced: 0 };
  const offlineItems = items.map((item) => ({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    bill_id: tempId,
  }));

  await db.bills.put(offlineBill);
  await db.bill_items.bulkAdd(offlineItems);

  await db.offline_queue.add({
    table: "bills",
    action: "insert",
    data: bill,
    created_at: new Date().toISOString(),
  });

  for (const item of items) {
    await db.offline_queue.add({
      table: "bill_items",
      action: "insert",
      data: item,
      created_at: new Date().toISOString(),
    });
  }

  return offlineBill;
}
