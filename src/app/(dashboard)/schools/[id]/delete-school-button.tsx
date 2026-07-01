"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  schoolId: string;
  schoolName: string;
}

export default function DeleteSchoolButton({ schoolId, schoolName }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceCount, setPriceCount] = useState(0);

  async function handleOpen() {
    const { count } = await supabase
      .from("price_list")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true);
    setPriceCount(count || 0);
    setOpen(true);
  }

  async function handleDelete() {
    setLoading(true);

    const { error: priceError } = await supabase
      .from("price_list")
      .update({ is_active: false })
      .eq("school_id", schoolId)
      .eq("is_active", true);

    if (priceError) {
      toast.error("Failed to deactivate prices: " + priceError.message);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("schools")
      .update({ is_active: false })
      .eq("id", schoolId);

    if (error) {
      toast.error("Failed to delete school: " + error.message);
    } else {
      toast.success("School deleted");
      router.push("/schools");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-black bg-white px-3 py-1.5 text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
        DELETE
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE SCHOOL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete &quot;{schoolName}&quot;?
            </p>
            {priceCount > 0 && (
              <div className="rounded-[12px] border-2 border-[#C42424] bg-red-50 p-3">
                <p className="text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase">
                  ⚠ WARNING: {priceCount} price{priceCount !== 1 ? "s" : ""} will be deactivated.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                TYPE SCHOOL NAME TO CONFIRM
              </Label>
              <Input
                placeholder={schoolName}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => { setOpen(false); setConfirmName(""); }}>
                <span>CANCEL</span>
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading || confirmName !== schoolName}
                className="bg-[#C42424] hover:bg-[#A01C1C]"
              >
                <span>{loading ? "DELETING..." : "DELETE"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
