import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import VoidBillButton from "./void-bill-button";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bill } = await supabase
    .from("bills")
    .select("*, schools(name, short_code)")
    .eq("id", id)
    .single();

  if (!bill) notFound();

  const { data: items } = await supabase
    .from("bill_items")
    .select("*")
    .eq("bill_id", id)
    .order("created_at");

  const school = Array.isArray(bill.schools) ? bill.schools[0] : bill.schools;
  const isVoided = bill.status === "voided";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasItemDiscounts = items?.some((item: any) => item.discount_amount > 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/bills"
            className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            BILLS
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)]">
              {bill.bill_number}
            </h1>
            <Badge>{bill.payment_method}</Badge>
            {isVoided && (
              <Badge className="bg-[#C42424]">VOIDED</Badge>
            )}
          </div>
        </div>
        {!isVoided && (
          <VoidBillButton billId={bill.id} billNumber={bill.bill_number} />
        )}
      </div>

      <Card className={isVoided ? "opacity-60" : ""}>
        <CardContent className="p-6 space-y-6">
          {/* Shop header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h2 className="text-[24px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              NANDALAYA
            </h2>
            <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              SCHOOL UNIFORMS & GARMENTS
            </p>
          </div>

          {/* Bill info */}
          <div className="grid grid-cols-2 gap-4 text-[14px]">
            <div>
              <p className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">BILL NO</p>
              <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">{bill.bill_number}</p>
            </div>
            <div>
              <p className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DATE</p>
              <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">
                {new Date(bill.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {school && (
              <div>
                <p className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SCHOOL</p>
                <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">{school.short_code || school.name}</p>
              </div>
            )}
            {bill.customer_name && (
              <div>
                <p className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">CUSTOMER</p>
                <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">{bill.customer_name}</p>
              </div>
            )}
            {bill.customer_phone && (
              <div>
                <p className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PHONE</p>
                <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">{bill.customer_phone}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">ITEM</th>
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-center">QTY</th>
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">PRICE</th>
                  {hasItemDiscounts && (
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">DISC</th>
                  )}
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-black last:border-0">
                    <td className="py-2.5">
                      <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">{item.product_name}</span>
                      {item.size_label && <span className="ml-1 text-[#4D8A6B] text-[12px]">({item.size_label})</span>}
                    </td>
                    <td className="py-2.5 text-center font-bold text-[#00592B] [font-family:var(--font-oswald)]">{item.qty}</td>
                    <td className="py-2.5 text-right font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{item.price}</td>
                    {hasItemDiscounts && (
                      <td className="py-2.5 text-right font-bold text-[#C42424] [font-family:var(--font-oswald)]">
                        {item.discount_amount > 0 ? `-₹${item.discount_amount}` : ""}
                      </td>
                    )}
                    <td className="py-2.5 text-right font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-black pt-4 space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SUBTOTAL</span>
              <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{bill.subtotal}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-[14px]">
                <span className="text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DISCOUNT</span>
                <span className="font-bold text-[#C42424] [font-family:var(--font-oswald)]">-₹{bill.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-[18px] font-bold border-t-2 border-black pt-2">
              <span className="text-[#00592B] [font-family:var(--font-oswald)] uppercase">TOTAL</span>
              <span className="text-[#E374C7] [font-family:var(--font-oswald)]">₹{bill.total}</span>
            </div>
          </div>

          {bill.notes && (
            <div className="border-t-2 border-black pt-4">
              <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">NOTES</p>
              <p className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)]">{bill.notes}</p>
            </div>
          )}

          {isVoided && bill.voided_at && (
            <div className="border-t-2 border-black pt-4">
              <p className="text-[12px] text-[#C42424] [font-family:var(--font-oswald)] uppercase font-bold">
                VOIDED ON {new Date(bill.voided_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          <div className="text-center border-t-2 border-black pt-4 text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
            THANK YOU FOR YOUR PURCHASE!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
