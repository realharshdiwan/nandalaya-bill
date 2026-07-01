"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  connectToPrinter,
  disconnectPrinter,
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
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [printing, setPrinting] = useState(false);

  async function handleConnect() {
    if (connected) {
      disconnectPrinter();
      setConnected(false);
      setStatus("Disconnected");
      toast.info("Printer disconnected");
      return;
    }

    const ok = await connectToPrinter((msg) => setStatus(msg));
    setConnected(ok);
    if (ok) toast.success("Printer connected!");
  }

  async function handlePrint() {
    if (!connected) {
      toast.error("Connect to printer first");
      return;
    }

    setPrinting(true);
    const receipt = generateReceipt(bill, items);
    const ok = await printReceipt(receipt, (msg) => setStatus(msg));
    if (ok) toast.success("Receipt printed!");
    setPrinting(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleConnect}
      >
        {connected ? (
          <Wifi className="mr-1 h-4 w-4 text-[#00592B]" />
        ) : (
          <WifiOff className="mr-1 h-4 w-4 text-[#C42424]" />
        )}
        <span>{connected ? "PRINTER ON" : "CONNECT"}</span>
      </Button>
      {connected && (
        <Button
          size="sm"
          onClick={handlePrint}
          disabled={printing}
          className="bg-[#00592B]"
        >
          <Printer className="mr-1 h-4 w-4" />
          <span>{printing ? "PRINTING..." : "THERMAL"}</span>
        </Button>
      )}
      {status && (
        <span className="text-[11px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
          {status}
        </span>
      )}
    </div>
  );
}
