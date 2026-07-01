"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  billId: string;
  isPaid: boolean;
}

export default function MarkPaidButton({ billId, isPaid }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    setLoading(true);
    const { error } = await supabase
      .from("bills")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", billId);

    if (error) {
      toast.error("Failed to mark as paid: " + error.message);
    } else {
      toast.success("Payment received!");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleMarkUnpaid() {
    setLoading(true);
    const { error } = await supabase
      .from("bills")
      .update({ is_paid: false, paid_at: null })
      .eq("id", billId);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Marked as unpaid");
      router.refresh();
    }
    setLoading(false);
  }

  if (isPaid) {
    return (
      <Button
        variant="tertiary"
        onClick={handleMarkUnpaid}
        disabled={loading}
        className="text-[12px]"
      >
        <CheckCircle className="mr-1 h-4 w-4 text-[#00592B]" />
        <span>PAID</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleMarkPaid}
      disabled={loading}
      className="bg-[#E374C7] hover:bg-[#d060b0] text-[12px]"
    >
      <CheckCircle className="mr-1 h-4 w-4" />
      <span>{loading ? "MARKING..." : "MARK PAID"}</span>
    </Button>
  );
}
