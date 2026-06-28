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
}

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface ExistingPrice {
  product_id: string;
  size_id: string | null;
  price: number;
}

export default function BulkPricePage() {
  const router = useRouter();
  const supabase = createClient();

  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [existingPrices, setExistingPrices] = useState<ExistingPrice[]>([]);
  // matrix[productId][sizeId|"__no_size__"] = price string
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [schoolsRes, productsRes, sizesRes] = await Promise.all([
        supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
        supabase.from("products").select("id, name").order("sort_order").order("name"),
        supabase.from("sizes").select("id, label, numeric_value").order("numeric_value"),
      ]);
      setSchools(schoolsRes.data || []);
      setProducts(productsRes.data || []);
      setSizes(sizesRes.data || []);
      setLoaded(true);
    }
    load();
  }, [supabase]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Load prices from the first selected school as template
  useEffect(() => {
    if (selectedSchools.length === 0) {
      setExistingPrices([]);
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
      setExistingPrices(prices);

      const m: Record<string, Record<string, string>> = {};
      products.forEach((p) => {
        m[p.id] = {};
        sizes.forEach((s) => {
          const existing = prices.find(
            (ep) => ep.product_id === p.id && ep.size_id === s.id
          );
          m[p.id][s.id] = existing ? String(existing.price) : "";
        });
        // NO SIZE column
        const noSizeExisting = prices.find(
          (ep) => ep.product_id === p.id && ep.size_id === null
        );
        m[p.id]["__no_size__"] = noSizeExisting ? String(noSizeExisting.price) : "";
      });
      setMatrix(m);
    }
    loadPrices();
  }, [selectedSchools, products, sizes, supabase]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    let upserts = 0;
    let deletes = 0;

    for (const schoolId of selectedSchools) {
      for (const product of products) {
        // Save sized prices
        for (const size of sizes) {
          const value = matrix[product.id]?.[size.id];
          const price = value ? parseFloat(value) : null;
          const existing = existingPrices.find(
            (ep) => ep.product_id === product.id && ep.size_id === size.id
          );

          if (price !== null && price > 0) {
            const { error } = await supabase.from("price_list").upsert(
              {
                school_id: schoolId,
                product_id: product.id,
                size_id: size.id,
                price,
                is_active: true,
              },
              { onConflict: "school_id,product_id,size_id" }
            );
            if (!error) upserts++;
          } else if (existing) {
            await supabase
              .from("price_list")
              .update({ is_active: false })
              .eq("school_id", schoolId)
              .eq("product_id", product.id)
              .eq("size_id", size.id);
            deletes++;
          }
        }

        // Save "no size" price
        const noSizeValue = matrix[product.id]?.["__no_size__"];
        const noSizePrice = noSizeValue ? parseFloat(noSizeValue) : null;
        const existingNoSize = existingPrices.find(
          (ep) => ep.product_id === product.id && ep.size_id === null
        );

        if (noSizePrice !== null && noSizePrice > 0) {
          const { error } = await supabase.from("price_list").upsert(
            {
              school_id: schoolId,
              product_id: product.id,
              size_id: null,
              price: noSizePrice,
              is_active: true,
            },
            { onConflict: "school_id,product_id,size_id" }
          );
          if (!error) upserts++;
        } else if (existingNoSize) {
          // Delete null-size row: use is_active = false + filter
          await supabase
            .from("price_list")
            .update({ is_active: false })
            .eq("school_id", schoolId)
            .eq("product_id", product.id)
            .is("size_id", null);
          deletes++;
        }
      }
    }

    toast.success(`Saved ${upserts} prices to ${selectedSchools.length} school(s)${deletes > 0 ? `, deactivated ${deletes}` : ""}`);
    setLoading(false);
    router.push("/prices");
  }

  const filledCount = Object.values(matrix).reduce((count, row) => {
    return count + Object.values(row).filter((v) => v && parseFloat(v) > 0).length;
  }, 0);

  const totalCells = products.length * (sizes.length + 1); // +1 for NO SIZE column

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

      {/* School multi-select */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px]">SELECT SCHOOLS ({selectedSchools.length} SELECTED)</CardTitle>
            <div className="flex gap-2">
              <Button variant="tertiary" onClick={selectAllSchools} className="text-[12px] h-8">
                ALL
              </Button>
              <Button variant="tertiary" onClick={clearSchools} className="text-[12px] h-8">
                CLEAR
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

          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-3 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold sticky left-0 bg-[#00592B]">
                    PRODUCT
                  </th>
                  {sizes.map((size) => (
                    <th key={size.id} className="text-center pb-3 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold min-w-[100px]">
                      {size.label}
                    </th>
                  ))}
                  <th className="text-center pb-3 text-[#E374C7] [font-family:var(--font-oswald)] uppercase font-bold min-w-[100px] border-l-2 border-[#4D8A6B]">
                    NO SIZE
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2 pr-4 font-bold text-white [font-family:var(--font-oswald)] uppercase sticky left-0 bg-[#00592B]">
                      {product.name}
                    </td>
                    {sizes.map((size) => (
                      <td key={size.id} className="py-2 px-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="₹"
                          value={matrix[product.id]?.[size.id] || ""}
                          onChange={(e) => updateCell(product.id, size.id, e.target.value)}
                          className="w-full text-center h-9 text-[13px]"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-1 border-l-2 border-[#4D8A6B]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="₹"
                        value={matrix[product.id]?.["__no_size__"] || ""}
                        onChange={(e) => updateCell(product.id, "__no_size__", e.target.value)}
                        className="w-full text-center h-9 text-[13px] border-[#E374C7]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
