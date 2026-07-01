"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditBillPanel from "./edit-bill-panel";

interface ExistingItem {
  id: string;
  product_id: string;
  product_name: string;
  size_id: string | null;
  size_label: string | null;
  qty: number;
  price: number;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

interface BillData {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  school_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
}

export default function EditBillButton({
  bill,
  items,
}: {
  bill: BillData;
  items: ExistingItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-1 h-4 w-4" />
        <span>EDIT</span>
      </Button>
      {open && (
        <EditBillPanel
          bill={bill}
          existingItems={items}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
