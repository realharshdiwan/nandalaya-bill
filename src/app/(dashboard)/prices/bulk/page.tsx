"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  short_code: string | null;
}

interface Product {
  id: string;
  name: string;
  size_group_id: string | null;
}

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface SizeGroup {
  id: string;
  name: string;
  sizes: Size[];
}

export default function BulkPricePage() {
  const router = useRouter();
  const supabase = createClient();

  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [schoolsRes, productsRes, groupsRes, groupItemsRes] = await Promise.all([
        supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
        supabase.from("products").select("id, name, size_group_id").order("sort_order").order("name"),
        supabase.from("size_groups").select("id, name").order("sort_order"),
        supabase.from("size_group_items").select("size_group_id, sizes(id, label, numeric_value)").order("sort_order"),
      ]);
      setSchools(schoolsRes.data || []);
      setProducts(productsRes.data || []);

      const itemsByGroup: Record<string, Size[]> = {};
      for (const item of groupItemsRes.data || []) {
        const size = Array.isArray(item.sizes) ? item.sizes[0] : item.sizes;
        if (!itemsByGroup[item.size_group_id]) itemsByGroup[item.size_group_id] = [];
        if (size) itemsByGroup[item.size_group_id].push(size);
      }

      setSizeGroups((groupsRes.data || []).map((g) => ({
        ...g,
        sizes: itemsByGroup[g.id] || [],
      })));
      setLoaded(true);
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (selectedSchools.length === 0) {
      setMatrix({});
      return;
    }
    async function loadPrices() {
      const firstSchool = selectedSchools[0];
      const { data } = await supabase
        .from("price_list")
        .select("product_id, size_id, price")
        .eq("school_id", firstSchool)
        .eq("is_active", true);

      const prices = data || [];
      const m: Record<string, Record<string, string>> = {};

      products.forEach((p) => {
        m[p.id] = {};
        const group = sizeGroups.find((g) => g.id === p.size_group_id);
        if (group) {
          group.sizes.forEach((s) => {
            const existing = prices.find(
              (ep) => ep.product_id === p.id && ep.size_id === s.id
            );
            m[p.id][s.id] = existing ? String(existing.price) : "";
          });
        }
        const noSizeExisting = prices.find(
          (ep) => ep.product_id === p.id && ep.size_id === null
        );
        m[p.id]["__no_size__"] = noSizeExisting ? String(noSizeExisting.price) : "";
      });

      setMatrix(m);
    }
    loadPrices();
  }, [selectedSchools, products, sizeGroups, supabase]);

  function toggleSchool(schoolId: string) {
    setSelectedSchools((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId]
    );
  }

  function selectAllSchools() {
    setSelectedSchools(schools.map((s) => s.id));
  }

  function clearSchools() {
    setSelectedSchools([]);
  }

  function updateCell(productId: string, sizeId: string, value: string) {
    setMatrix((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [sizeId]: value,
      },
    }));
  }

  async function handleSave() {
    if (selectedSchools.length === 0) {
      toast.error("Select at least one school");
      return;
    }

    setLoading(true);

    try {
      type PriceRow = {
        school_id: string;
        product_id: string;
        size_id: string | null;
        price: number;
      };
      const rows: PriceRow[] = [];

      for (const schoolId of selectedSchools) {
        for (const product of products) {
          const group = sizeGroups.find((g) => g.id === product.size_group_id);
          if (group) {
            for (const size of group.sizes) {
              const value = matrix[product.id]?.[size.id];
              const price = value ? parseFloat(value) : null;
              if (price !== null && price > 0) {
                rows.push({ school_id: schoolId, product_id: product.id, size_id: size.id, price });
              }
            }
          }
          const noSizeValue = matrix[product.id]?.["__no_size__"];
          const noSizePrice = noSizeValue ? parseFloat(noSizeValue) : null;
          if (noSizePrice !== null && noSizePrice > 0) {
            rows.push({ school_id: schoolId, product_id: product.id, size_id: null, price: noSizePrice });
          }
        }
      }

      if (rows.length === 0) {
        toast.error("Enter at least one price");
        setLoading(false);
        return;
      }

      const existingMap = new Map<string, string>();
      await Promise.all(
        selectedSchools.map(async (schoolId) => {
          const { data } = await supabase
            .from("price_list")
            .select("id, product_id, size_id")
            .eq("school_id", schoolId);
          if (data) {
            for (const row of data) {
              const key = `${schoolId}|${row.product_id}|${row.size_id}`;
              existingMap.set(key, row.id);
            }
          }
        })
      );

      const inserts: PriceRow[] = [];
      const updates: { id: string; price: number }[] = [];

      for (const row of rows) {
        const key = `${row.school_id}|${row.product_id}|${row.size_id}`;
        const existingId = existingMap.get(key);
        if (existingId) {
          updates.push({ id: existingId, price: row.price });
        } else {
          inserts.push(row);
        }
      }

      let saved = 0;

      const updateResults = await Promise.all(
        updates.map(({ id, price }) =>
          supabase.from("price_list").update({ price, is_active: true }).eq("id", id)
        )
      );
      saved += updateResults.filter((r) => !r.error).length;

      const insertResults = await Promise.all(
        inserts.map((row) =>
          supabase.from("price_list").insert({
            school_id: row.school_id,
            product_id: row.product_id,
            size_id: row.size_id,
            price: row.price,
            is_active: true,
          })
        )
      );
      saved += insertResults.filter((r) => !r.error).length;

      toast.success(`Saved ${saved} prices to ${selectedSchools.length} school(s)`);
    } catch (err) {
      toast.error("Failed to save prices: " + (err instanceof Error ? err.message : "Unknown error"));
    }

    setLoading(false);
    router.push("/prices");
  }

  const filledCount = Object.values(matrix).reduce((count, row) => {
    return count + Object.values(row).filter((v) => v && parseFloat(v) > 0).length;
  }, 0);

  const totalCells = products.reduce((sum, p) => {
    const group = sizeGroups.find((g) => g.id === p.size_group_id);
    return sum + (group ? group.sizes.length : 0) + 1;
  }, 0);

  // Group products by size group
  const groupedProducts = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.size_group_id || "__no_group__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-[#4D8A6B] rounded animate-pulse" />
        <div className="h-64 bg-[#4D8A6B] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/prices"
            className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            PRICES
          </Link>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            BULK PRICE ENTRY
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">SELECT SCHOOLS ({selectedSchools.length} SELECTED)</CardTitle>
            <div className="flex gap-2">
              <Button variant="tertiary" onClick={selectAllSchools} size="xs">
                <span>ALL</span>
              </Button>
              <Button variant="tertiary" onClick={clearSchools} size="xs">
                <span>CLEAR</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => {
              const isSelected = selectedSchools.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSchool(s.id)}
                  className={`flex items-center gap-3 rounded-[12px] border-2 px-4 py-3 text-left transition-all [font-family:var(--font-oswald)] uppercase font-bold ${
                    isSelected
                      ? "border-black bg-[#00592B] text-white shadow-[2px_2px_0_0_#000]"
                      : "border-black bg-white text-[#00592B] hover:shadow-[2px_2px_0_0_#000]"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 ${
                    isSelected ? "border-white bg-white" : "border-[#4D8A6B]"
                  }`}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-[#00592B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[14px]">
                    {s.short_code ? `${s.short_code} — ${s.name}` : s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSchools.length > 0 && products.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
              {filledCount} OF {totalCells} FILLED
            </p>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              <span>{loading ? "SAVING..." : `SAVE TO ${selectedSchools.length} SCHOOL(S)`}</span>
            </Button>
          </div>

          {/* Products without a size group */}
          {groupedProducts["__no_group__"] && (
            <Card>
              <CardHeader className="pb-2 bg-[#0023D1] rounded-t-[12px]">
                <CardTitle className="text-[15px] text-white [font-family:var(--font-oswald)] uppercase tracking-wider">
                  NO SIZE GROUP
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-[14px] border-collapse">
                  <thead>
                    <tr className="bg-[#00592B]">
                      <th className="text-left px-4 py-3 text-white/70 [font-family:var(--font-oswald)] uppercase font-bold text-[13px]">
                        PRODUCT
                      </th>
                      <th className="text-center px-4 py-3 text-white/70 [font-family:var(--font-oswald)] uppercase font-bold text-[13px] w-[140px]">
                        PRICE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedProducts["__no_group__"].map((product) => (
                      <tr key={product.id} className="border-b border-[#4D8A6B]/20">
                        <td className="px-4 py-3 font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                          {product.name}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="₹ 0"
                            value={matrix[product.id]?.["__no_size__"] || ""}
                            onChange={(e) => updateCell(product.id, "__no_size__", e.target.value)}
                            className="w-full text-center h-11 text-[14px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Products grouped by size group */}
          {Object.entries(groupedProducts)
            .filter(([key]) => key !== "__no_group__")
            .map(([groupId, groupProducts]) => {
              const group = sizeGroups.find((g) => g.id === groupId);
              if (!group || group.sizes.length === 0) return null;
              return (
                <Card key={groupId}>
                  <CardHeader className="pb-2 bg-[#0023D1] rounded-t-[12px]">
                    <CardTitle className="text-[15px] text-white [font-family:var(--font-oswald)] uppercase tracking-wider">
                      {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-[14px] border-collapse">
                      <thead>
                        <tr className="bg-[#00592B]">
                          <th className="text-left px-4 py-3 text-white/70 [font-family:var(--font-oswald)] uppercase font-bold text-[13px] sticky left-0 bg-[#00592B] z-10">
                            PRODUCT
                          </th>
                          {group.sizes.map((size) => (
                            <th key={size.id} className="text-center px-3 py-3 text-white/70 [font-family:var(--font-oswald)] uppercase font-bold text-[13px] min-w-[76px]">
                              {size.label}
                            </th>
                          ))}
                          <th className="text-center px-3 py-3 text-[#E374C7] [font-family:var(--font-oswald)] uppercase font-bold text-[13px] min-w-[90px] border-l-2 border-[#4D8A6B]/40">
                            NO SIZE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupProducts.map((product) => (
                          <tr key={product.id} className="border-b border-[#4D8A6B]/20">
                            <td className="px-4 py-3 font-bold text-[#00592B] bg-white [font-family:var(--font-oswald)] uppercase sticky left-0 z-10 whitespace-nowrap">
                              {product.name}
                            </td>
                            {group.sizes.map((size) => (
                              <td key={size.id} className="px-1 py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="₹"
                                  value={matrix[product.id]?.[size.id] || ""}
                                  onChange={(e) => updateCell(product.id, size.id, e.target.value)}
                                  className="w-full text-center h-11 text-[14px]"
                                />
                              </td>
                            ))}
                            <td className="px-1 py-2 border-l-2 border-[#4D8A6B]/40">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="₹"
                                value={matrix[product.id]?.["__no_size__"] || ""}
                                onChange={(e) => updateCell(product.id, "__no_size__", e.target.value)}
                                className="w-full text-center h-11 text-[14px] border-[#E374C7]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })}
        </>
      )}

      {selectedSchools.length > 0 && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            ADD PRODUCTS FIRST
          </p>
        </div>
      )}
    </div>
  );
}
