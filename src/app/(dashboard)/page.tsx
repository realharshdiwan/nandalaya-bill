"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, School, Package, IndianRupee, Receipt } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: "school" | "product" | "price";
  id: string;
  title: string;
  subtitle: string;
  price?: number;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const term = `%${q}%`;

    const [schoolsRes, productsRes, pricesRes] = await Promise.all([
      supabase
        .from("schools")
        .select("id, name, short_code")
        .or(`name.ilike.${term},short_code.ilike.${term}`)
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("products")
        .select("id, name, category")
        .ilike("name", term)
        .limit(5),
      supabase
        .from("price_list")
        .select("id, price, schools(name, short_code), products(name), sizes(label)")
        .eq("is_active", true)
        .or(
          `schools.name.ilike.${term},schools.short_code.ilike.${term},products.name.ilike.${term},sizes.label.ilike.${term}`
        )
        .limit(10),
    ]);

    const searchResults: SearchResult[] = [];

    schoolsRes.data?.forEach((s) =>
      searchResults.push({
        type: "school",
        id: s.id,
        title: s.name,
        subtitle: s.short_code || "",
      })
    );

    productsRes.data?.forEach((p) =>
      searchResults.push({
        type: "product",
        id: p.id,
        title: p.name,
        subtitle: p.category,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pricesRes.data?.forEach((p: any) =>
      searchResults.push({
        type: "price",
        id: p.id,
        title: `${p.schools?.short_code || p.schools?.name} — ${p.products?.name} (${p.sizes?.label})`,
        subtitle: `₹${p.price}`,
        price: p.price,
      })
    );

    setResults(searchResults);
    setLoading(false);
  }, [supabase]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold uppercase text-white [font-family:var(--font-oswald)]">
          What are you looking for?
        </h1>
        <p className="mt-1 text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
          Search schools, products, or prices instantly
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B8AC8A]" />
        <Input
          type="search"
          placeholder="TYPE A SCHOOL NAME, PRODUCT, OR SIZE..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer);
            (window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => search(e.target.value), 300);
          }}
          className="h-14 pl-12 text-[20px]"
        />
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, i) => {
            const iconMap = { school: School, product: Package, price: IndianRupee };
            const Icon = iconMap[result.type];
            return (
              <Link
                key={`${result.type}-${result.id}-${i}`}
                href={
                  result.type === "school"
                    ? `/schools/${result.id}`
                    : result.type === "product"
                    ? `/products`
                    : `/prices`
                }
              >
                <Card className="cursor-pointer transition-all hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-4 border-black bg-[#00592B]">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold uppercase text-[#00592B] truncate [font-family:var(--font-oswald)]">
                        {result.title}
                      </p>
                      <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                        {result.subtitle}
                      </p>
                    </div>
                    {result.price !== undefined && (
                      <Badge variant="default" className="text-[18px]">
                        ₹{result.price}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[18px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
            No results found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Quick actions when no search */}
      {!query && (
        <div className="grid gap-8 sm:grid-cols-2">
          <Link href="/bills/new">
            <Card className="cursor-pointer transition-all hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] border-[#E374C7]">
              <CardHeader className="pb-2">
                <Receipt className="h-10 w-10 text-[#E374C7]" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-[24px]">New Bill</CardTitle>
                <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                  Create a new invoice
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/schools">
            <Card className="cursor-pointer transition-all hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <CardHeader className="pb-2">
                <School className="h-10 w-10 text-[#00592B]" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-[24px]">Schools</CardTitle>
                <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                  View all schools
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/products">
            <Card className="cursor-pointer transition-all hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <CardHeader className="pb-2">
                <Package className="h-10 w-10 text-[#00592B]" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-[24px]">Products</CardTitle>
                <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                  View all products
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/prices">
            <Card className="cursor-pointer transition-all hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <CardHeader className="pb-2">
                <IndianRupee className="h-10 w-10 text-[#00592B]" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-[24px]">Price List</CardTitle>
                <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                  Manage all prices
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
