"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import {
  isPrinterConnected,
  printReceipt,
  generateReceipt,
} from "@/lib/thermal-printer";
import { getShopConfigAll } from "@/lib/data";
import PrinterDialog from "@/components/printer-dialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shopConfig, setShopConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    getShopConfigAll().then(setShopConfig);
  }, []);

  async function handlePrint() {
    if (!isPrinterConnected()) {
      setDialogOpen(true);
      return;
    }

    setPrinting(true);
    const receipt = generateReceipt(bill, items, shopConfig);
    const ok = await printReceipt(receipt, (msg) => {
      if (msg) toast.info(msg);
    });
    if (ok) toast.success("Receipt printed!");
    setPrinting(false);
  }

  return (
    <>
      <Button
        size="sm"
        onClick={handlePrint}
        disabled={printing}
      >
        <Printer className="mr-1 h-4 w-4" />
        <span>{printing ? "PRINTING..." : "THERMAL"}</span>
      </Button>
      <PrinterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
