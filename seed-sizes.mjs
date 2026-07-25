import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ryhltvwitharelsumfem.supabase.co",
  "sb_publishable_nuGct-VJDP7phrbN109U1A_wztT3Cu4"
);

// ── Step 1: Create all unique sizes ──
const numericSizes = [
  { label: "1", numeric_value: 1 },
  { label: "2", numeric_value: 2 },
  { label: "3", numeric_value: 3 },
  { label: "4", numeric_value: 4 },
  { label: "5", numeric_value: 5 },
  { label: "6", numeric_value: 6 },
  { label: "7", numeric_value: 7 },
  { label: "8", numeric_value: 8 },
  { label: "9", numeric_value: 9 },
  { label: "10", numeric_value: 10 },
  { label: "11", numeric_value: 11 },
  { label: "12", numeric_value: 12 },
  { label: "13", numeric_value: 13 },
  { label: "14", numeric_value: 14 },
  { label: "15", numeric_value: 15 },
  { label: "16", numeric_value: 16 },
  { label: "17", numeric_value: 17 },
  { label: "18", numeric_value: 18 },
  { label: "20", numeric_value: 20 },
  { label: "22", numeric_value: 22 },
  { label: "24", numeric_value: 24 },
  { label: "26", numeric_value: 26 },
  { label: "28", numeric_value: 28 },
  { label: "30", numeric_value: 30 },
  { label: "32", numeric_value: 32 },
  { label: "34", numeric_value: 34 },
  { label: "36", numeric_value: 36 },
  { label: "38", numeric_value: 38 },
  { label: "40", numeric_value: 40 },
  { label: "42", numeric_value: 42 },
  { label: "44", numeric_value: 44 },
];

const alphaSizes = [
  { label: "S", numeric_value: 1 },
  { label: "M", numeric_value: 2 },
  { label: "L", numeric_value: 3 },
];

const beltSizes = [
  { label: "Small", numeric_value: 1 },
  { label: "Large", numeric_value: 2 },
];

const allSizes = [...numericSizes, ...alphaSizes, ...beltSizes];

console.log("Creating sizes...");
const { data: sizes, error: sizeErr } = await supabase
  .from("sizes")
  .insert(allSizes)
  .select();

if (sizeErr) { console.error("Size error:", sizeErr); process.exit(1); }
console.log(`  Created ${sizes.length} sizes`);

const sizeMap = {};
for (const s of sizes) {
  sizeMap[s.label] = s.id;
}

// ── Step 2: Create size groups ──
const groups = [
  { name: "SHIRT", sort_order: 1 },
  { name: "HALF_PANT", sort_order: 2 },
  { name: "PANT", sort_order: 3 },
  { name: "TSHIRT", sort_order: 4 },
  { name: "TUNIC", sort_order: 5 },
  { name: "SKIRT", sort_order: 6 },
  { name: "BLAZER", sort_order: 7 },
  { name: "SWEATER", sort_order: 8 },
  { name: "SHOE_KIDS", sort_order: 9 },
  { name: "SHOE_ADULT", sort_order: 10 },
  { name: "STOCKINGS", sort_order: 11 },
  { name: "BELT", sort_order: 12 },
];

console.log("Creating size groups...");
const { data: createdGroups, error: grpErr } = await supabase
  .from("size_groups")
  .insert(groups)
  .select();

if (grpErr) { console.error("Group error:", grpErr); process.exit(1); }
console.log(`  Created ${createdGroups.length} groups`);

const groupMap = {};
for (const g of createdGroups) {
  groupMap[g.name] = g.id;
}

// ── Step 3: Create size_group_items ──
const groupSizes = {
  SHIRT:     [16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
  HALF_PANT: [11, 12, 13, 14, 15, 16, 17, 18],
  PANT:      [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
  TSHIRT:    [22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
  TUNIC:     [22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
  SKIRT:     [14, 16, 18, 20, 22, 24, 26, 28],
  BLAZER:    [22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42],
  SWEATER:   [24, 26, 28, 30, 32, 34, 36, 38, 40, 42],
  SHOE_KIDS: ["10", "11", "12", "13", "1", "2", "3", "4"],
  SHOE_ADULT: ["5", "6", "7", "8", "9", "10", "11"],
  STOCKINGS: ["S", "M", "L"],
  BELT:      ["Small", "Large"],
};

const items = [];
for (const [groupName, sizeLabels] of Object.entries(groupSizes)) {
  const groupId = groupMap[groupName];
  sizeLabels.forEach((label, idx) => {
    const sizeId = sizeMap[String(label)];
    if (!sizeId) {
      console.error(`  Missing size "${label}" for group "${groupName}"`);
      return;
    }
    items.push({
      size_group_id: groupId,
      size_id: sizeId,
      sort_order: idx,
    });
  });
}

// Delete existing items first
await supabase.from("size_group_items").delete().neq("size_group_id", "00000000-0000-0000-0000-000000000000");

console.log("Creating size_group_items...");
const { error: itemErr } = await supabase
  .from("size_group_items")
  .insert(items);

if (itemErr) { console.error("Item error:", itemErr); process.exit(1); }
console.log(`  Created ${items.length} group-item links`);

// ── Summary ──
console.log("\n✅ Done! Summary:");
console.log(`  Sizes:         ${sizes.length}`);
console.log(`  Groups:        ${createdGroups.length}`);
console.log(`  Group-Items:   ${items.length}`);
for (const g of createdGroups) {
  const count = items.filter(i => i.size_group_id === g.id).length;
  const sizeList = groupSizes[g.name].join(", ");
  console.log(`    ${g.name} (${count}): ${sizeList}`);
}
