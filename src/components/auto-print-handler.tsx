"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isPrinterConnected, printReceipt, generateReceipt } from "@/lib/thermal-printer";
import { toast } from "sonner";

interface BillItem {
  product_name: string;
  size_label: string | null;
  qty: number;
  price: number;
  discount_amount: number;
  subtotal: number;
}

interface BillData {
  bill_number: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  notes: string | null;
}

export default function AutoPrintHandler({
  bill,
  items,
  shopConfig,
}: {
  bill: BillData;
  items: BillItem[];
  shopConfig: Record<string, string>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("autoprint") !== "true") return;

    if (isPrinterConnected()) {
      const receipt = generateReceipt(bill, items, shopConfig);
      printReceipt(receipt, (msg) => {
        if (msg) toast.info(msg);
      }).then((ok) => {
        if (ok) toast.success("Receipt printed!");
      });
    } else {
      toast.info("Printer not connected. Tap THERMAL to print.");
    }
  }, []);

  return null;
}
