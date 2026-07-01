"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";

interface Props {
  billId: string;
  isPaid: boolean;
}

export default function MarkPaidButton({ billId, isPaid }: Props) {
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
      startTransition(() => {
        router.refresh();
      });
    }
    setLoading(false);
  }

  if (optimisticPaid) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleTogglePaid}
        disabled={loading || isPending}
      >
        <CheckCircle className="mr-1 h-4 w-4 text-[#00592B]" />
        <span className="text-[#00592B]">PAID</span>
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
