"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Wifi, WifiOff, Bluetooth } from "lucide-react";
import { toast } from "sonner";
import {
  isPrinterConnected,
  connectToPrinter,
  disconnectPrinter,
} from "@/lib/thermal-printer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrinterDialog({ open, onOpenChange }: Props) {
  const [connected, setConnected] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setConnected(isPrinterConnected());
  }, [open]);

  async function handleConnect() {
    setLoading(true);
    setStatus("Searching for printer...");

    const ok = await connectToPrinter((msg) => setStatus(msg));
    setConnected(ok);

    if (ok) {
      toast.success("Printer connected!");
    }
    setLoading(false);
  }

  function handleDisconnect() {
    disconnectPrinter();
    setConnected(false);
    setPrinterName("");
    setStatus("Disconnected");
    toast.info("Printer disconnected");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>THERMAL PRINTER</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
            CONNECT A BLUETOOTH THERMAL PRINTER
          </p>

          <div className="flex items-center gap-3">
            {connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00592B] px-3 py-1 text-[12px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                CONNECTED{printerName ? ` — ${printerName}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C42424] px-3 py-1 text-[12px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
                <Bluetooth className="h-3 w-3" />
                NOT CONNECTED
              </span>
            )}
          </div>

          {status && (
            <p className="text-[12px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
              {status}
            </p>
          )}

          <div className="flex gap-3">
            {connected ? (
              <Button variant="danger" onClick={handleDisconnect}>
                <WifiOff className="mr-1 h-4 w-4" />
                <span>DISCONNECT</span>
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={loading}>
                <Wifi className="mr-1 h-4 w-4" />
                <span>{loading ? "SEARCHING..." : "CONNECT"}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <span>CLOSE</span>
            </Button>
          </div>

          <div className="rounded-[12px] border-2 border-black bg-[#E5F1EA] p-3 space-y-2">
            <p className="text-[12px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
              HOW TO CONNECT:
            </p>
            <ol className="text-[12px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold space-y-1 list-decimal list-inside">
              <li>Turn on your Bluetooth thermal printer</li>
              <li>Make sure it is in pairing mode</li>
              <li>Click CONNECT above</li>
              <li>Select your printer from the browser popup</li>
            </ol>
            <p className="text-[11px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase">
              Works with ESC/POS printers (80mm or 58mm). Supported on Chrome/Edge.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
