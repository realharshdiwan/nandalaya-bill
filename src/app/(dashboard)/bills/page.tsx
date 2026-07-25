"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import db from "@/lib/db";
import { initData } from "@/lib/data";

const PAGE_SIZE = 20;

export default function BillsPage() {
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<any[]>([]);
  const [schools, setSchools] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initData().then(async () => {
      const all = await db.bills.orderBy("created_at").reverse().toArray();
      setBills(all);
      const schoolList = await db.schools.toArray();
      setSchools(Object.fromEntries(schoolList.map((s) => [s.id, s])));
      setLoaded(true);
    });
  }, []);

  const showVoided = searchParams.has("show_voided");
  const dateRange = searchParams.get("date") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const search = searchParams.get("search") || "";

  const filtered = useMemo(() => {
    let list = bills;

    if (!showVoided) {
      list = list.filter((b) => b.status !== "voided");
    }

    const now = new Date();
    if (dateRange === "today") {
      const todayStr = now.toISOString().split("T")[0];
      list = list.filter((b) => b.created_at >= todayStr);
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      list = list.filter((b) => b.created_at >= weekAgo);
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      list = list.filter((b) => b.created_at >= monthAgo);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bill_number?.toLowerCase().includes(q) ||
          b.customer_name?.toLowerCase().includes(q) ||
          b.customer_phone?.includes(q)
      );
    }

    return list;
  }, [bills, showVoided, dateRange, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (dateRange !== "all") sp.set("date", dateRange);
    if (showVoided) sp.set("show_voided", "1");
    sp.set("page", String(p));
    return `/bills?${sp.toString()}`;
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">BILLS</h1>
          </div>
        </div>
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[12px] bg-white/20" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            BILLS
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {total} BILLS
          </p>
        </div>
        <Link href="/bills/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            <span>NEW BILL</span>
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <form className="relative flex-1" method="GET">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4D8A6B]" />
          {showVoided && <input type="hidden" name="show_voided" value="1" />}
          {dateRange !== "all" && <input type="hidden" name="date" value={dateRange} />}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="SEARCH BY BILL NUMBER, NAME, OR PHONE..."
            className="w-full rounded-[12px] border-2 border-black bg-white px-10 py-2.5 text-[14px] font-bold text-[#00592B] placeholder:text-[#4D8A6B] outline-none focus:shadow-[10px_10px_0_0_#000] [font-family:var(--font-oswald)] uppercase"
          />
        </form>
        <Link href={showVoided ? "/bills" : "/bills?show_voided"}>
          <Button variant={showVoided ? "default" : "tertiary"}>
            <span>{showVoided ? "HIDE VOIDED" : "SHOW VOIDED"}</span>
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { label: "ALL", value: "all" },
          { label: "TODAY", value: "today" },
          { label: "THIS WEEK", value: "week" },
          { label: "THIS MONTH", value: "month" },
        ].map((preset) => {
          const href = preset.value === "all"
            ? `/bills${showVoided ? "?show_voided" : ""}`
            : `/bills?date=${preset.value}${showVoided ? "&show_voided" : ""}`;
          const isActive = dateRange === preset.value;
          return (
            <Link key={preset.value} href={href}>
              <Button variant={isActive ? "default" : "tertiary"} size="xs">
                <span>{preset.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      {paged.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {paged.map((bill: any) => {
              const school = bill.school_id ? schools[bill.school_id] : null;
              const isVoided = bill.status === "voided";
              return (
                <Link key={bill.id} href={`/bills/${bill.id}`}>
                  <Card className={`cursor-pointer hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] ${isVoided ? "opacity-60" : ""}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                            {bill.bill_number}
                          </p>
                          <Badge>
                            {bill.payment_method}
                          </Badge>
                          {!isVoided && (
                            <Badge className={bill.is_paid ? "bg-[#00592B]" : "bg-[#E374C7]"}>
                              {bill.is_paid ? "PAID" : "UNPAID"}
                            </Badge>
                          )}
                          {isVoided && (
                            <Badge className="bg-[#C42424]">VOIDED</Badge>
                          )}
                        </div>
                        <p className="text-[14px] text-[#003F1E] truncate [font-family:var(--font-oswald)] uppercase font-bold">
                          {bill.customer_name || "WALK-IN"}
                          {bill.customer_phone && ` • ${bill.customer_phone}`}
                          {school && ` • ${school.short_code || school.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">
                          ₹{bill.total}
                        </p>
                        <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                          {new Date(bill.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Link href={buildHref(page - 1)}>
                <Button variant="tertiary" size="xs" className={page <= 1 ? "pointer-events-none opacity-40" : ""}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-[14px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
                {page} / {totalPages}
              </span>
              <Link href={buildHref(page + 1)}>
                <Button variant="tertiary" size="xs" className={page >= totalPages ? "pointer-events-none opacity-40" : ""}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-[#4D8A6B]" />
          <p className="mt-4 text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            {search ? "NO BILLS FOUND" : "NO BILLS YET"}
          </p>
          {!search && (
            <Link href="/bills/new">
              <Button variant="tertiary" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                <span>CREATE YOUR FIRST BILL</span>
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
