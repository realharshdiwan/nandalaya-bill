"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import {
  isPrinterConnected,
  printReceipt,
  generateReceipt,
} from "@/lib/thermal-printer";

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

export default function ThermalPrintButton({
  bill,
  items,
}: {
  bill: BillData;
  items: BillItem[];
}) {
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (!isPrinterConnected()) {
      toast.error("No printer connected. Go to Settings to connect.");
      return;
    }

    setPrinting(true);
    const receipt = generateReceipt(bill, items);
    const ok = await printReceipt(receipt, (msg) => {
      if (msg) toast.info(msg);
    });
    if (ok) toast.success("Receipt printed!");
    setPrinting(false);
  }

  return (
    <Button
      size="sm"
      onClick={handlePrint}
      disabled={printing}
    >
      <Printer className="mr-1 h-4 w-4" />
      <span>{printing ? "PRINTING..." : "THERMAL"}</span>
    </Button>
  );
}
