"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#00592B]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-4 border-black bg-[#00592B] px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] border-2 border-black bg-white text-[#00592B]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">
            N
          </div>
          <span className="text-[16px] font-bold uppercase text-white [font-family:var(--font-oswald)]">
            Nandalaya
          </span>
        </div>
      </header>

      <main className="lg:pl-[288px]">
        <div className="mx-auto max-w-[1280px] px-4 py-4 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
