"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, CircleDollarSign } from "lucide-react";
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

interface Props {
  billId: string;
  isPaid: boolean;
  billItems?: BillItem[];
  billData?: BillData;
  shopConfig?: Record<string, string>;
}

export default function MarkPaidButton({ billId, isPaid, billItems, billData, shopConfig }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [optimisticPaid, setOptimisticPaid] = useState(isPaid);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleTogglePaid() {
    setLoading(true);
    const newPaid = !optimisticPaid;
    setOptimisticPaid(newPaid);

    const { error } = await supabase
      .from("bills")
      .update({
        is_paid: newPaid,
        paid_at: newPaid ? new Date().toISOString() : null,
      })
      .eq("id", billId);

    if (error) {
      setOptimisticPaid(optimisticPaid);
      toast.error("Failed: " + error.message);
    } else {
      toast.success(newPaid ? "Payment received!" : "Marked as unpaid");

      // Auto-print receipt when marking as paid
      if (newPaid && billData && billItems && isPrinterConnected()) {
        const receipt = generateReceipt(billData, billItems, shopConfig);
        printReceipt(receipt, (msg) => {
          if (msg) toast.info(msg);
        }).then((ok) => {
          if (ok) toast.success("Receipt printed!");
        });
      } else if (newPaid && !isPrinterConnected()) {
        toast.info("Printer not connected. Tap THERMAL to print.");
      }

      startTransition(() => {
        router.refresh();
      });
    }
    setLoading(false);
  }

  if (optimisticPaid) {
    return (
      <Button
        variant="tertiary"
        size="sm"
        onClick={handleTogglePaid}
        disabled={loading || isPending}
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        <span>PAID</span>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleTogglePaid}
      disabled={loading || isPending}
      className="bg-[#E374C7] hover:bg-[#d060b0]"
    >
      <CircleDollarSign className="mr-1 h-4 w-4" />
      <span>{loading ? "MARKING..." : "MARK PAID"}</span>
    </Button>
  );
}
