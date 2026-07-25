import { createClient } from "@/lib/supabase/client";
import db from "@/lib/db";

export async function syncAll() {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  try {
    const results = await Promise.allSettled([
      syncSchools(supabase),
      syncProducts(supabase),
      syncSizes(supabase),
      syncSizeGroups(supabase),
      syncSizeGroupItems(supabase),
      syncPriceList(supabase),
      syncShopConfig(supabase),
      syncBills(supabase),
    ]);

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn("Sync: some tables failed", failed);
    }
  } catch {
    // silently fail when offline
  }
}

async function syncSchools(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("schools").select("*");
  if (data) {
    await db.schools.clear();
    await db.schools.bulkAdd(data as any[]);
  }
}

async function syncProducts(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("products").select("*");
  if (data) {
    await db.products.clear();
    await db.products.bulkAdd(data as any[]);
  }
}

async function syncSizes(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("sizes").select("*");
  if (data) {
    await db.sizes.clear();
    await db.sizes.bulkAdd(data as any[]);
  }
}

async function syncSizeGroups(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("size_groups").select("*");
  if (data) {
    await db.size_groups.clear();
    await db.size_groups.bulkAdd(data as any[]);
  }
}

async function syncSizeGroupItems(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("size_group_items")
    .select("size_group_id, size_id, sort_order")
    .order("sort_order");
  if (data) {
    await db.size_group_items.clear();
    await db.size_group_items.bulkAdd(data as any[]);
  }
}

async function syncPriceList(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("price_list")
    .select("*")
    .eq("is_active", true);
  if (data) {
    await db.price_list.clear();
    await db.price_list.bulkAdd(data as any[]);
  }
}

async function syncShopConfig(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("shop_config").select("*");
  if (data) {
    const localOnly = await db.shop_config
      .filter((r) => !data.some((d: any) => d.key === r.key))
      .toArray();
    await db.shop_config.clear();
    await db.shop_config.bulkAdd([...data, ...localOnly] as any[]);
  }
}

async function syncBills(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("bills")
    .select("*, bill_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (data) {
    const unsyncedBills = await db.bills.where("synced").equals(0).toArray();
    const unsyncedIds = unsyncedBills.map((b) => b.id);
    const unsyncedItems = unsyncedIds.length > 0
      ? await db.bill_items.where("bill_id").anyOf(unsyncedIds).toArray()
      : [];

    await db.bills.clear();
    await db.bills.bulkAdd([
      ...unsyncedBills,
      ...data.map((row) => ({ ...row, bill_items: undefined, synced: 1 })),
    ]);

    await db.bill_items.clear();
    await db.bill_items.bulkAdd([
      ...unsyncedItems,
      ...data.flatMap((row) =>
        Array.isArray(row.bill_items) ? row.bill_items : []
      ),
    ]);
  }
}

export async function flushOfflineQueue() {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const queue = await db.offline_queue.toArray();

  for (const entry of queue) {
    try {
      if (entry.action === "insert") {
        await supabase.from(entry.table).insert(entry.data as any);
        if (entry.table === "bills") {
          await db.bills.update((entry.data as any).id, { synced: 1 });
        }
      } else if (entry.action === "update") {
        const { id, ...rest } = entry.data as any;
        if (id) {
          await supabase.from(entry.table).update(rest).eq("id", id);
        }
      }
      await db.offline_queue.delete(entry.id!);
    } catch {
      // keep in queue for next retry
    }
  }
}
