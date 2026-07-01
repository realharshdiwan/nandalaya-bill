"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TrendingUp, IndianRupee, Receipt, CreditCard, Banknote, Smartphone, ClipboardList } from "lucide-react";

interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  monthBills: number;
  pendingPayments: number;
  cashToday: number;
  upiToday: number;
  cardToday: number;
  creditToday: number;
  todayBills: number;
  lowStockProducts: { name: string; current_stock: number; low_stock_threshold: number }[];
  topProducts: { name: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);

      const [todayRes, weekRes, monthRes, pendingRes, topRes, todayBillsRes, lowStockRes] = await Promise.all([
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", todayStart),
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", weekStart.toISOString()),
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", monthStart.toISOString()),
        supabase.from("bills").select("total").eq("status", "active").eq("payment_method", "credit").gte("created_at", monthStart.toISOString()),
        supabase.from("bill_items").select("product_name").gte("created_at", monthStart.toISOString()),
        supabase.from("bills").select("total, payment_method, payment_details").eq("status", "active").gte("created_at", todayStart),
        supabase.from("products").select("name, current_stock, low_stock_threshold").gt("low_stock_threshold", 0),
      ]);

      const todayRevenue = todayRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const weekRevenue = weekRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const monthRevenue = monthRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const monthBills = monthRes.data?.length || 0;
      const pendingPayments = pendingRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;

      // Cash/UPI/Card/Credit today — handles split payments via payment_details
      let cashToday = 0;
      let upiToday = 0;
      let cardToday = 0;
      let creditToday = 0;
      const todayBills = todayBillsRes.data?.length || 0;
      todayBillsRes.data?.forEach((b) => {
        if (b.payment_method === "cash") {
          cashToday += b.total || 0;
        } else if (b.payment_method === "upi") {
          upiToday += b.total || 0;
        } else if (b.payment_method === "card") {
          cardToday += b.total || 0;
        } else if (b.payment_method === "credit") {
          creditToday += b.total || 0;
        } else if (b.payment_method === "split" && b.payment_details) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b.payment_details as any[]).forEach((p) => {
            if (p.method === "cash") cashToday += p.amount || 0;
            if (p.method === "upi") upiToday += p.amount || 0;
            if (p.method === "card") cardToday += p.amount || 0;
            if (p.method === "credit") creditToday += p.amount || 0;
          });
        }
      });

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

      const lowStockProducts = (lowStockRes.data || []).filter(
        (p) => p.current_stock <= p.low_stock_threshold
      );

      setStats({ todayRevenue, weekRevenue, monthRevenue, monthBills, pendingPayments, cashToday, upiToday, cardToday, creditToday, todayBills, lowStockProducts, topProducts });
    }
    loadStats();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold uppercase text-white [font-family:var(--font-oswald)]">
          Dashboard
        </h1>
        <p className="mt-1 text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
          Business overview
        </p>
      </div>

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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E374C7]">
                  <Banknote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">CASH TODAY</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.cashToday.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#0023D1]">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">UPI TODAY</p>
                  <p className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.upiToday.toLocaleString("en-IN")}</p>
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

      {stats && (
        <>
        {/* Daily Closing Summary */}
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5 text-[#00592B]" />
              <p className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
                TODAY&apos;S CLOSING — {stats.todayBills} BILL{stats.todayBills !== 1 ? "S" : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[12px] border-2 border-black bg-white p-3">
                <p className="text-[11px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">💵 CASH</p>
                <p className="text-[18px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.cashToday.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[12px] border-2 border-black bg-white p-3">
                <p className="text-[11px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">📱 UPI</p>
                <p className="text-[18px] font-bold text-[#0023D1] [font-family:var(--font-oswald)]">₹{stats.upiToday.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[12px] border-2 border-black bg-white p-3">
                <p className="text-[11px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">💳 CARD</p>
                <p className="text-[18px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{stats.cardToday.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[12px] border-2 border-black bg-white p-3">
                <p className="text-[11px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">📋 CREDIT</p>
                <p className="text-[18px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">₹{stats.creditToday.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center border-t-2 border-black pt-3">
              <span className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">TOTAL COLLECTED</span>
              <span className="text-[20px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">
                ₹{(stats.cashToday + stats.upiToday + stats.cardToday).toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        {stats.lowStockProducts.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-4">
              <p className="text-[14px] text-[#C42424] [font-family:var(--font-oswald)] uppercase font-bold mb-3">
                ⚠ LOW STOCK ALERTS ({stats.lowStockProducts.length})
              </p>
              <div className="space-y-2">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.name} className="flex justify-between items-center text-[14px]">
                    <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                      {p.name}
                    </span>
                    <span className={`font-bold [font-family:var(--font-oswald)] ${p.current_stock === 0 ? "text-[#C42424]" : "text-[#E374C7]"}`}>
                      {p.current_stock === 0 ? "OUT OF STOCK" : `${p.current_stock} LEFT`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  );
}