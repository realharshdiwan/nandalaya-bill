"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { amountToWords } from "@/lib/amount-to-words";
import VoidBillButton from "./void-bill-button";
import PrintButton from "./print-button";
import MarkPaidButton from "./mark-paid-button";
import EditBillButton from "./edit-bill-button";
import ThermalPrintButton from "./thermal-print-button";
import AutoPrintHandler from "@/components/auto-print-handler";
import { getBill, getShopConfigAll } from "@/lib/data";

export default function BillDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [shopMap, setShopMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getBill(id);
      if (!result) {
        setLoading(false);
        return;
      }
      setBill(result.bill);
      setItems(result.items);

      const config = await getShopConfigAll();
      setShopMap(config);

      const hasUpi =
        result.bill.payment_method === "upi" ||
        result.bill.payment_method === "split" ||
        ((result.bill.payment_details as any[])?.some((p: any) => p.method === "upi"));

      if (hasUpi) {
        let upiAmount = result.bill.total;
        if (result.bill.payment_details) {
          const upiPart = (result.bill.payment_details as any[])?.find((p: any) => p.method === "upi");
          if (upiPart) upiAmount = upiPart.amount;
        }
        const upiId = config.upi_id || "";
        if (upiId) {
          const qp = new URLSearchParams({
            pa: upiId,
            pn: config.legal_name || "NANDALAYA",
            am: upiAmount.toFixed(2),
            tn: result.bill.bill_number,
            cu: "INR",
          });
          const uri = `upi://pay?${qp.toString()}`;
          const dataUri = await QRCode.toDataURL(uri, {
            width: 256,
            margin: 1,
            color: { dark: "#000000", light: "#FFFFFF" },
          });
          setQrDataUri(dataUri);
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-[#4D8A6B] rounded animate-pulse" />
        <div className="h-64 bg-[#4D8A6B] rounded animate-pulse" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center py-12">
        <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
          BILL NOT FOUND
        </p>
        <Link
          href="/bills"
          className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          BACK TO BILLS
        </Link>
      </div>
    );
  }

  const isVoided = bill.status === "voided";
  const hasItemDiscounts = items.some((item: any) => item.discount_amount > 0);
  const hasHsn = items.some((item: any) => item.hsn_code);
  const paymentDetails = bill.payment_details;
  const hasUpi =
    bill.payment_method === "upi" ||
    bill.payment_method === "split" ||
    (paymentDetails && paymentDetails.some((p: any) => p.method === "upi"));

  let upiAmount = bill.total;
  if (hasUpi && paymentDetails) {
    const upiPart = paymentDetails.find((p: any) => p.method === "upi");
    if (upiPart) upiAmount = upiPart.amount;
  }

  const unsynced = bill.synced === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {unsynced && (
        <div className="rounded-[12px] border-2 border-[#0023D1] bg-blue-50 px-4 py-3 text-center">
          <p className="text-[13px] font-bold text-[#0023D1] [font-family:var(--font-oswald)] uppercase">
            Saved locally — will sync when back online
          </p>
        </div>
      )}

      {/* Header — hidden during print */}
      <div className="space-y-3 no-print">
        <Link
          href="/bills"
          className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          BILLS
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)]">
            {bill.bill_number}
          </h1>
          <Badge>{bill.payment_method === "split" ? "SPLIT" : bill.payment_method}</Badge>
          <Badge className={bill.is_paid ? "bg-[#00592B]" : "bg-[#E374C7]"}>
            {bill.is_paid ? "PAID" : "UNPAID"}
          </Badge>
          {isVoided && (
            <Badge className="bg-[#C42424]">VOIDED</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isVoided && !unsynced && (
            <EditBillButton
              bill={{
                id: bill.id,
                customer_name: bill.customer_name,
                customer_phone: bill.customer_phone,
                school_id: bill.school_id,
                subtotal: bill.subtotal,
                discount: bill.discount,
                total: bill.total,
                notes: bill.notes,
              }}
              items={items}
            />
          )}
          {!isVoided && !unsynced && (
            <MarkPaidButton
              billId={bill.id}
              isPaid={bill.is_paid}
              billItems={items}
              billData={{
                bill_number: bill.bill_number,
                created_at: bill.created_at,
                customer_name: bill.customer_name,
                customer_phone: bill.customer_phone,
                subtotal: bill.subtotal,
                discount: bill.discount,
                total: bill.total,
                payment_method: bill.payment_method,
                notes: bill.notes,
              }}
              shopConfig={shopMap}
            />
          )}
          <PrintButton />
          {!isVoided && (
            <ThermalPrintButton
              bill={{
                bill_number: bill.bill_number,
                created_at: bill.created_at,
                customer_name: bill.customer_name,
                customer_phone: bill.customer_phone,
                subtotal: bill.subtotal,
                discount: bill.discount,
                total: bill.total,
                payment_method: bill.payment_method,
                notes: bill.notes,
              }}
              items={items}
            />
          )}
          <AutoPrintHandler
            bill={{
              bill_number: bill.bill_number,
              created_at: bill.created_at,
              customer_name: bill.customer_name,
              customer_phone: bill.customer_phone,
              subtotal: bill.subtotal,
              discount: bill.discount,
              total: bill.total,
              payment_method: bill.payment_method,
              notes: bill.notes,
            }}
            items={items}
            shopConfig={shopMap}
          />
          {!isVoided && !unsynced && (
            <VoidBillButton billId={bill.id} billNumber={bill.bill_number} />
          )}
        </div>
      </div>

      {/* QR Code — screen only */}
      {hasUpi && qrDataUri && !isVoided && (
        <Card className="no-print">
          <CardContent className="p-6 flex flex-col items-center gap-3">
            <p className="text-[16px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
              SCAN TO PAY
            </p>
            <p className="text-[28px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">
              ₹{upiAmount}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUri}
              alt="UPI QR Code"
              className="h-[256px] w-[256px] rounded-[12px] border-2 border-black"
            />
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase">
              AMOUNT IS LOCKED — CUSTOMER CANNOT CHANGE IT
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment breakdown — screen only */}
      {paymentDetails && paymentDetails.length > 0 && (
        <Card className="no-print">
          <CardContent className="p-4">
            <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold mb-3">
              PAYMENT BREAKDOWN
            </p>
            <div className="space-y-2">
              {paymentDetails.map((p: { method: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between items-center text-[14px]">
                  <span className="text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
                    {p.method}
                  </span>
                  <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">
                    ₹{p.amount}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center text-[16px] border-t-2 border-black pt-2">
                <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">TOTAL PAID</span>
                <span className="font-bold text-[#E374C7] [font-family:var(--font-oswald)]">₹{bill.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt — this is what prints */}
      <Card className={`receipt-print ${isVoided ? "opacity-60" : ""}`}>
        <CardContent className="p-6 space-y-6">
          {/* Shop header */}
          <div className="text-center border-b-2 border-black pb-4">
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              BILL OF SUPPLY
            </p>
            <h2 className="text-[24px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              {shopMap.legal_name || "NANDALAYA"}
            </h2>
            <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              {shopMap.shop_tagline || "SCHOOL UNIFORMS & GARMENTS"}
            </p>
            {shopMap.shop_address && (
              <p className="text-[12px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                {shopMap.shop_address}
              </p>
            )}
            {shopMap.gstin && (
              <p className="text-[12px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                GSTIN: {shopMap.gstin} (Composite Tax Payee)
              </p>
            )}
            {shopMap.shop_phone && (
              <p className="text-[12px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                Mob. {shopMap.shop_phone}
              </p>
            )}
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
                {bill.created_at
                  ? new Date(bill.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : new Date().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
              </p>
            </div>
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
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DESCRIPTION</th>
                  {hasHsn && <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-center">HSN</th>}
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-center">QTY</th>
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">RATE</th>
                  {hasItemDiscounts && (
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">DISC</th>
                  )}
                  <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-black last:border-0">
                    <td className="py-2.5">
                      <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">{item.product_name}</span>
                      {item.size_label && <span className="ml-1 text-[#4D8A6B] text-[12px]">({item.size_label})</span>}
                    </td>
                    {hasHsn && (
                      <td className="py-2.5 text-center text-[#00592B] [font-family:var(--font-oswald)]">
                        {item.hsn_code || ""}
                      </td>
                    )}
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

          {/* Amount in words */}
          <div className="border-t-2 border-black pt-4">
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">AMOUNT IN WORDS</p>
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              {amountToWords(bill.total)}
            </p>
          </div>

          {/* Payment on receipt */}
          {paymentDetails && paymentDetails.length > 0 && (
            <div className="border-t-2 border-black pt-4">
              <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold mb-2">PAID</p>
              {paymentDetails.map((p: { method: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between text-[14px]">
                  <span className="text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">{p.method}</span>
                  <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{p.amount}</span>
                </div>
              ))}
            </div>
          )}

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

          <div className="text-center border-t-2 border-black pt-4 space-y-3">
            <p className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
              AUTHORIZED SIGNATORY
            </p>
            <div className="w-48 mx-auto border-b-2 border-black" />
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              THANK YOU FOR YOUR PURCHASE!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
