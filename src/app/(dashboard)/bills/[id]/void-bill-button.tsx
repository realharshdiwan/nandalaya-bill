"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ban } from "lucide-react";
import { toast } from "sonner";

interface Props {
  billId: string;
  billNumber: string;
}

export default function VoidBillButton({ billId, billNumber }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmNumber, setConfirmNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleVoid() {
    setLoading(true);

    const { error } = await supabase
      .from("bills")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
      })
      .eq("id", billId);

    if (error) {
      toast.error("Failed to void bill: " + error.message);
    } else {
      toast.success(`Bill ${billNumber} voided`);
      setOpen(false);
      startTransition(() => {
        router.refresh();
      });
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="tertiary"
        className="text-[#C42424]"
      >
        <Ban className="mr-2 h-4 w-4" />
        <span>VOID</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VOID BILL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to void bill &quot;{billNumber}&quot;?
            </p>
            <div className="rounded-[12px] border-2 border-[#C42424] bg-red-50 p-3">
              <p className="text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase">
                ⚠ This cannot be undone. The bill will be marked as voided and excluded from totals.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                TYPE BILL NUMBER TO CONFIRM
              </Label>
              <Input
                placeholder={billNumber}
                value={confirmNumber}
                onChange={(e) => setConfirmNumber(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => { setOpen(false); setConfirmNumber(""); }}>
                CANCEL
              </Button>
              <Button
                onClick={handleVoid}
                disabled={loading || isPending || confirmNumber !== billNumber}
                className="bg-[#C42424] hover:bg-[#A01C1C]"
              >
                <span>{loading ? "VOIDING..." : "VOID BILL"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
