"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TrendingUp, IndianRupee, Receipt, CreditCard, Banknote, Smartphone } from "lucide-react";

interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  monthBills: number;
  pendingPayments: number;
  cashToday: number;
  upiToday: number;
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

      const [todayRes, weekRes, monthRes, pendingRes, topRes, todayBillsRes] = await Promise.all([
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", todayStart),
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", weekStart.toISOString()),
        supabase.from("bills").select("total").eq("status", "active").gte("created_at", monthStart.toISOString()),
        supabase.from("bills").select("total").eq("status", "active").eq("payment_method", "credit").gte("created_at", monthStart.toISOString()),
        supabase.from("bill_items").select("product_name").gte("created_at", monthStart.toISOString()),
        supabase.from("bills").select("total, payment_method, payment_details").eq("status", "active").gte("created_at", todayStart),
      ]);

      const todayRevenue = todayRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const weekRevenue = weekRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const monthRevenue = monthRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const monthBills = monthRes.data?.length || 0;
      const pendingPayments = pendingRes.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;

      // Cash/UPI today — handles split payments via payment_details
      let cashToday = 0;
      let upiToday = 0;
      todayBillsRes.data?.forEach((b) => {
        if (b.payment_method === "cash") {
          cashToday += b.total || 0;
        } else if (b.payment_method === "upi") {
          upiToday += b.total || 0;
        } else if (b.payment_method === "split" && b.payment_details) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b.payment_details as any[]).forEach((p) => {
            if (p.method === "cash") cashToday += p.amount || 0;
            if (p.method === "upi") upiToday += p.amount || 0;
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

      setStats({ todayRevenue, weekRevenue, monthRevenue, monthBills, pendingPayments, cashToday, upiToday, topProducts });
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
    </div>
  );
}