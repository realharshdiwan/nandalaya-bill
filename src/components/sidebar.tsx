"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  LayoutDashboard,
  School,
  Package,
  IndianRupee,
  Receipt,
  Settings,
  LogOut,
  Truck,
  BoxesIcon,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Search", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schools", label: "Schools", icon: School },
  { href: "/products", label: "Products", icon: Package },
  { href: "/prices", label: "Prices", icon: IndianRupee },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/inventory", label: "Inventory", icon: BoxesIcon },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col border-r-4 border-black bg-white transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b-4 border-black px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#00592B] text-[18px] font-bold text-white [font-family:var(--font-oswald)]">
            N
          </div>
          <span className="text-[20px] font-bold uppercase text-[#00592B] [font-family:var(--font-oswald)]">
            Nandalaya
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 px-4 py-6">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] px-4 py-3 text-[16px] font-bold uppercase transition-all [font-family:var(--font-oswald)]",
                  isActive
                    ? "bg-[#00592B] text-white shadow-[2px_2px_0_0_#000] border-2 border-black"
                    : "text-[#00592B] hover:bg-[#E374C7] hover:text-black"
                )}
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t-4 border-black px-4 py-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-[16px] font-bold uppercase text-[#00592B] transition-all [font-family:var(--font-oswald)] hover:bg-[#E374C7] hover:text-black"
          >
            <LogOut className="h-6 w-6" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
