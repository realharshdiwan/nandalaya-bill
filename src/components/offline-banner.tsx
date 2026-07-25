"use client";

import { useState, useEffect } from "react";
import { flushOfflineQueue } from "@/lib/sync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor;
}

async function getNetworkStatus(): Promise<boolean> {
  if (isCapacitor()) {
    try {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }
  return navigator.onLine;
}

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getNetworkStatus().then((connected) => setOffline(!connected));

    if (isCapacitor()) {
      import("@capacitor/network").then(({ Network }) => {
        Network.addListener("networkStatusChange", (status) => {
          if (status.connected) {
            setOffline(false);
            setSyncing(true);
            flushOfflineQueue().finally(() => setSyncing(false));
          } else {
            setOffline(true);
          }
        });
      });
      return;
    }

    const goOffline = () => setOffline(true);
    const goOnline = async () => {
      setOffline(false);
      setSyncing(true);
      await flushOfflineQueue();
      setSyncing(false);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline && !syncing) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full border-2 border-black px-4 py-2 shadow-[2px_2px_0_0_#000] ${
        syncing ? "bg-[#0023D1] text-white" : "bg-[#C42424] text-white"
      }`}
    >
      <div className="flex items-center gap-2 text-[13px] font-bold [font-family:var(--font-oswald)] uppercase">
        {syncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline — bills saved locally
          </>
        )}
      </div>
    </div>
  );
}
