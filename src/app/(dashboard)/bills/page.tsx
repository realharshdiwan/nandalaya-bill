import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface BillListRow {
  id: string;
  bill_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  payment_method: string;
  is_paid: boolean;
  created_at: string;
  status: string;
  schools: { name: string; short_code: string | null }[] | { name: string; short_code: string | null };
}

const PAGE_SIZE = 20;

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const showVoided = typeof params.show_voided === "string";
  const dateRange = typeof params.date === "string" ? params.date : "all";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let countQuery = supabase
    .from("bills")
    .select("id", { count: "exact", head: true });

  let query = supabase
    .from("bills")
    .select("id, bill_number, customer_name, customer_phone, total, payment_method, is_paid, created_at, status, schools(name, short_code)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!showVoided) {
    query = query.eq("status", "active");
    countQuery = countQuery.eq("status", "active");
  }

  const now = new Date();
  if (dateRange === "today") {
    const todayStr = now.toISOString().split("T")[0];
    query = query.gte("created_at", todayStr);
    countQuery = countQuery.gte("created_at", todayStr);
  } else if (dateRange === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte("created_at", weekAgo.toISOString());
    countQuery = countQuery.gte("created_at", weekAgo.toISOString());
  } else if (dateRange === "month") {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    query = query.gte("created_at", monthAgo.toISOString());
    countQuery = countQuery.gte("created_at", monthAgo.toISOString());
  }

  const search = typeof params.search === "string" ? params.search : "";
  if (search) {
    const filter = `bill_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`;
    query = query.or(filter);
    countQuery = countQuery.or(filter);
  }

  const [{ data: bills }, { count: total }] = await Promise.all([
    query,
    countQuery,
  ]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            BILLS
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {total || 0} BILLS
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
        <form className="relative flex-1">
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

      {bills && bills.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {bills.map((bill: BillListRow) => {
              const school = Array.isArray(bill.schools) ? bill.schools[0] : bill.schools;
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

          {totalPages > 1 && (() => {
            const buildHref = (p: number) => {
              const sp = new URLSearchParams();
              if (search) sp.set("search", search);
              if (dateRange !== "all") sp.set("date", dateRange);
              if (showVoided) sp.set("show_voided", "1");
              sp.set("page", String(p));
              return `/bills?${sp.toString()}`;
            };
            return (
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
            );
          })()}
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
