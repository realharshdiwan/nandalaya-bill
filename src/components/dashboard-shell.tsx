"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Menu, ShoppingCart } from "lucide-react";
import { getCartCount, getCartTotal } from "@/lib/cart";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const refreshCart = useCallback(() => {
    setCartCount(getCartCount());
    setCartTotal(getCartTotal());
  }, []);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleCartClick() {
    router.push("/bills/new");
  }

  return (
    <div className="min-h-screen bg-[#00592B]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-4 border-black bg-[#00592B] px-4">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-[12px] border-2 border-black bg-white text-[#00592B] active:bg-gray-100 cursor-pointer touch-manipulation"
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

      <main className={sidebarOpen ? "md:pl-[288px]" : ""}>
        <div className="mx-auto max-w-[1280px] px-4 py-4 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Floating cart pill — hidden on school detail pages (they have their own sticky bar) */}
      {cartCount > 0 && !pathname.startsWith("/schools/") && (
        <button
          onClick={handleCartClick}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-full border-2 border-black bg-[#00592B] px-4 py-2.5 shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer lg:bottom-8 lg:right-8"
        >
          <ShoppingCart className="h-5 w-5 text-white" />
          <span className="text-[15px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            {cartCount}
          </span>
          <span className="h-4 w-px bg-white/40" />
          <span className="text-[15px] text-[#E374C7] [font-family:var(--font-oswald)] font-bold">
            ₹{cartTotal}
          </span>
        </button>
      )}
    </div>
  );
}
