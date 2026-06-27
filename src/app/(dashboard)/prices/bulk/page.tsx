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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  size_id: string;
  price: number;
}

export default function BulkPricePage() {
  const router = useRouter();
  const supabase = createClient();

  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [existingPrices, setExistingPrices] = useState<ExistingPrice[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [schoolsRes, productsRes, sizesRes] = await Promise.all([
        supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
        supabase.from("products").select("id, name").order("name"),
        supabase.from("sizes").select("id, label, numeric_value").order("numeric_value"),
      ]);
      setSchools(schoolsRes.data || []);
      setProducts(productsRes.data || []);
      setSizes(sizesRes.data || []);
      setLoaded(true);
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (!selectedSchool) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExistingPrices([]);
      setMatrix({});
      return;
    }
    async function loadPrices() {
      const { data } = await supabase
        .from("price_list")
        .select("product_id, size_id, price")
        .eq("school_id", selectedSchool)
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
      });
      setMatrix(m);
    }
    loadPrices();
  }, [selectedSchool, products, sizes, supabase]);

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
    if (!selectedSchool) {
      toast.error("Select a school first");
      return;
    }

    setLoading(true);
    let upserts = 0;
    let deletes = 0;

    for (const product of products) {
      for (const size of sizes) {
        const value = matrix[product.id]?.[size.id];
        const price = value ? parseFloat(value) : null;
        const existing = existingPrices.find(
          (ep) => ep.product_id === product.id && ep.size_id === size.id
        );

        if (price !== null && price > 0) {
          const { error } = await supabase.from("price_list").upsert(
            {
              school_id: selectedSchool,
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
            .eq("school_id", selectedSchool)
            .eq("product_id", product.id)
            .eq("size_id", size.id);
          deletes++;
        }
      }
    }

    toast.success(`Saved ${upserts} prices${deletes > 0 ? `, deactivated ${deletes}` : ""}`);
    setLoading(false);
    router.push("/prices");
  }

  const filledCount = Object.values(matrix).reduce((count, row) => {
    return count + Object.values(row).filter((v) => v && parseFloat(v) > 0).length;
  }, 0);

  const totalCells = products.length * sizes.length;

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
          <CardTitle className="text-[16px]">SELECT SCHOOL</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v ?? "")}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="CHOOSE A SCHOOL" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.short_code ? `${s.short_code} — ${s.name}` : s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSchool && products.length > 0 && sizes.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
              {filledCount} OF {totalCells} FILLED
            </p>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              <span>{loading ? "SAVING..." : "SAVE ALL"}</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedSchool && (products.length === 0 || sizes.length === 0) && (
        <div className="text-center py-12">
          <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {products.length === 0 ? "ADD PRODUCTS FIRST" : "ADD SIZES FIRST"}
          </p>
        </div>
      )}
    </div>
  );
}
