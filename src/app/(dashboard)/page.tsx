"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, School, Package, IndianRupee, Receipt, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: "school" | "product" | "price";
  id: string;
  title: string;
  subtitle: string;
  price?: number;
}

interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  monthBills: number;
  pendingPayments: number;
  topProducts: { name: string; count: number }[];
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const supabase = createClient();

  async function loadStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);

    const [todayRes, weekRes, monthRes, pendingRes, topRes] = await Promise.all([
      supabase.from("bills").select("total").eq("status", "active").gte("created_at", todayStart),
      supabase.from("bills").select("total").eq("status", "active").gte("created_at", weekStart.toISOString()),
      supabase.from("bills").select("total").eq("status", "active").gte("created_at", monthStart.toISOString()),
      supabase.from("bills").select("total").eq("status", "active").eq("payment_method", "credit").gte("created_at", monthStart.toISOString()),
      supabase.from("bill_items").select("product_name").gte("created_at", monthStart.toISOString()),
    ]);

    const todayRevenue = todayRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
    const weekRevenue = weekRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
    const monthRevenue = monthRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
    const monthBills = monthRes.data?.length || 0;
    const pendingPayments = pendingRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;

    const productCounts: Record<string, number> = {};
    topRes.data?.forEach((item) => {
      if (item.product_name) {
        productCounts[item.product_name] = (productCounts[item.product_name] || 0) + 1;
      }
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setStats({ todayRevenue, weekRevenue, monthRevenue, monthBills, pendingPayments, topProducts });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

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

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const iconMap = {
    school: School,
    product: Package,
    price: IndianRupee,
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">TODAY</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.todayRevenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">THIS WEEK</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.weekRevenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                  <IndianRupee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">30 DAYS</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.monthRevenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">BILLS (30 DAYS)</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">{stats.monthBills}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E374C7]">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PENDING (CREDIT)</p>
                  <p className="text-[20px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">₹{stats.pendingPayments.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {stats.topProducts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold mb-2">TOP PRODUCTS (30 DAYS)</p>
                <div className="space-y-1">
                  {stats.topProducts.map((p, i) => (
                    <div key={p.name} className="flex justify-between text-[14px]">
                      <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                        {i + 1}. {p.name}
                      </span>
                      <span className="text-[#4D8A6B] [font-family:var(--font-oswald)] font-bold">{p.count}×</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 text-[20px]"
          autoFocus
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
