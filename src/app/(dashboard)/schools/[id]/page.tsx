"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, ShoppingCart, Minus, User, Check } from "lucide-react";
import DeleteSchoolButton from "./delete-school-button";
import { addToCart, getCart, removeFromCart, CartItem } from "@/lib/cart";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  short_code: string | null;
  address: string | null;
  phone: string | null;
}

interface PriceEntry {
  product_id: string;
  product_name: string;
  size_id: string | null;
  size_label: string;
  price: number;
}

interface ProductGroup {
  name: string;
  category: string;
  entries: PriceEntry[];
}

interface PriceListRow {
  id: string;
  price: number;
  products: { id: string; name: string; category: string }[] | { id: string; name: string; category: string };
  sizes: { id: string; label: string; numeric_value: number }[] | { id: string; label: string; numeric_value: number };
}

interface NormalizedPriceRow {
  id: string;
  price: number;
  products: { id: string; name: string; category: string };
  sizes: { id: string; label: string; numeric_value: number };
}

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [school, setSchool] = useState<School | null>(null);
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPayment, setQuickPayment] = useState("cash");
  const [quickCustomer, setQuickCustomer] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickShowCustomer, setQuickShowCustomer] = useState(false);

  const loadCart = useCallback(() => {
    setCartState(getCart());
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadCart();
    window.addEventListener("cart-updated", loadCart);
    return () => window.removeEventListener("cart-updated", loadCart);
  }, [loadCart]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    async function load() {
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name, short_code, address, phone, school_group_id")
        .eq("id", id)
        .single();

      if (!schoolData) {
        setLoading(false);
        return;
      }
      setSchool(schoolData);

      const groupId = (schoolData as { school_group_id: string | null }).school_group_id;

      const [schoolPricesRes, groupPricesRes] = await Promise.all([
        supabase
          .from("price_list")
          .select("id, price, products(id, name, category), sizes(id, label, numeric_value)")
          .eq("school_id", id)
          .eq("is_active", true)
          .order("products(name)"),
        groupId
          ? supabase
              .from("price_list")
              .select("id, price, products(id, name, category), sizes(id, label, numeric_value)")
              .eq("school_group_id", groupId)
              .eq("is_active", true)
              .order("products(name)")
          : Promise.resolve({ data: [] }),
      ]);

      const normalize = (rows: any[]) =>
        (rows || []).map((pl: PriceListRow): NormalizedPriceRow => ({
          ...pl,
          products: Array.isArray(pl.products) ? pl.products[0] : pl.products,
          sizes: Array.isArray(pl.sizes) ? pl.sizes[0] : pl.sizes,
        }));

      const schoolPrices = normalize(schoolPricesRes.data || []);
      const groupPrices = normalize(groupPricesRes.data || []);

      const schoolKeys = new Set(schoolPrices.map((p) => `${p.products?.id}-${p.sizes?.id || ""}`));
      const priceList: NormalizedPriceRow[] = [
        ...schoolPrices,
        ...groupPrices.filter((p) => !schoolKeys.has(`${p.products?.id}-${p.sizes?.id || ""}`)),
      ];

      const productMap: Record<string, ProductGroup> = {};
      priceList.forEach((pl) => {
        const name = pl.products?.name || "Unknown";
        if (!productMap[name]) {
          productMap[name] = {
            name,
            category: pl.products?.category || "",
            entries: [],
          };
        }
        productMap[name].entries.push({
          product_id: pl.products?.id || "",
          product_name: name,
          size_id: pl.sizes?.id || null,
          size_label: pl.sizes?.label || "",
          price: pl.price,
        });
      });

      const groups = Object.values(productMap);
      groups.sort((a, b) => {
        const order = ["uniform", "shoes", "accessories", "other"];
        const ai = order.indexOf(a.category);
        const bi = order.indexOf(b.category);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      setProducts(groups);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  function getQtyInCart(productId: string, sizeId: string | null): number {
    const item = cart.find(
      (c) => c.product_id === productId && c.size_id === sizeId
    );
    return item?.qty || 0;
  }

  function handleAdd(entry: PriceEntry) {
    addToCart({
      product_id: entry.product_id,
      product_name: entry.product_name,
      size_id: entry.size_id,
      size_label: entry.size_label,
      price: entry.price,
    });
  }

  function handleRemove(productId: string, sizeId: string | null) {
    const idx = cart.findIndex(
      (c) => c.product_id === productId && c.size_id === sizeId
    );
    if (idx >= 0) removeFromCart(idx);
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Load default payment method
  useEffect(() => {
    supabase
      .from("shop_config")
      .select("value")
      .eq("key", "default_payment")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setQuickPayment(data.value);
      });
  }, [supabase]);

  async function quickSave() {
    if (cart.length === 0) return;
    setQuickSaving(true);

    const { data: billNumber, error: bnError } = await supabase.rpc("generate_bill_number");
    if (bnError || !billNumber) {
      toast.error("Failed to generate bill number");
      setQuickSaving(false);
      return;
    }

    const subtotal = cartTotal;
    const total = subtotal;

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        bill_number: billNumber,
        customer_name: quickCustomer || null,
        school_id: id,
        subtotal,
        discount: 0,
        total,
        payment_method: quickPayment,
        is_paid: quickPayment !== "credit",
        paid_at: quickPayment !== "credit" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (billError) {
      toast.error("Failed to create bill: " + billError.message);
      setQuickSaving(false);
      return;
    }

    const billItems = cart.map((item) => ({
      bill_id: bill.id,
      product_id: item.product_id,
      size_id: item.size_id || null,
      product_name: item.product_name,
      size_label: item.size_label || null,
      qty: item.qty,
      price: item.price,
      subtotal: item.qty * item.price,
      discount_type: "none",
      discount_value: 0,
      discount_amount: 0,
    }));

    const { error: itemsError } = await supabase.from("bill_items").insert(billItems);

    if (itemsError) {
      await supabase.from("bills").delete().eq("id", bill.id);
      toast.error("Failed to save items: " + itemsError.message);
      setQuickSaving(false);
      return;
    }

    // Decrement stock
    for (const item of cart) {
      await supabase.rpc("decrement_stock", { p_product_id: item.product_id, p_qty: item.qty });
    }

    // Clear cart
    const { clearCart } = await import("@/lib/cart");
    clearCart();

    toast.success(`Bill ${billNumber} created`);
    const billIsPaid = quickPayment !== "credit";
    router.push(`/bills/${bill.id}${billIsPaid ? "?autoprint=true" : ""}`);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#4D8A6B] rounded animate-pulse" />
        <div className="h-40 bg-[#4D8A6B] rounded animate-pulse" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
          SCHOOL NOT FOUND
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-3">
        <Link
          href="/schools"
          className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          SCHOOLS
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            {school.name}
          </h1>
          {school.short_code && <Badge>{school.short_code}</Badge>}
        </div>
        {(school.address || school.phone) && (
          <div className="flex items-center gap-4 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {school.address && <span>{school.address}</span>}
            {school.phone && <span>{school.phone}</span>}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/schools/${id}/edit`}>
            <Button variant="tertiary" size="sm">
              <Pencil className="mr-1 h-4 w-4" />
              <span>EDIT</span>
            </Button>
          </Link>
          <DeleteSchoolButton schoolId={id} schoolName={school.name} />
          <Link href={`/prices?school_id=${id}`}>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              <span>ADD PRICE</span>
            </Button>
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            const categoryMap: Record<string, ProductGroup[]> = {};
            for (const p of products) {
              const cat = p.category || "other";
              if (!categoryMap[cat]) categoryMap[cat] = [];
              categoryMap[cat].push(p);
            }
            const catOrder = ["uniform", "shoes", "accessories", "other"];
            const sortedCats = Object.keys(categoryMap).sort(
              (a, b) => catOrder.indexOf(a) - catOrder.indexOf(b)
            );
            return sortedCats.map((cat) => (
              <div key={cat} className="space-y-3">
                <h2 className="text-[18px] font-bold text-[#E374C7] [font-family:var(--font-oswald)] uppercase border-b border-[#E374C7]/30 pb-2">
                  {cat === "uniform" ? "UNIFORMS" : cat === "shoes" ? "SHOES" : cat === "accessories" ? "ACCESSORIES" : "OTHER"}
                </h2>
                <div className="space-y-4">
                  {categoryMap[cat].map((product) => (
                    <Card key={product.name}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-[18px]">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {product.entries.map((entry) => {
                            const qty = getQtyInCart(entry.product_id, entry.size_id);
                            return (
                              <div
                                key={`${entry.size_id || "none"}-${entry.price}`}
                                className={`flex items-center gap-2 rounded-[12px] border-2 border-black px-3 py-2 transition-all ${
                                  qty > 0
                                    ? "bg-[#00592B] text-white shadow-[2px_2px_0_0_#000]"
                                    : "bg-white"
                                }`}
                              >
                                <span className={`text-[14px] [font-family:var(--font-oswald)] uppercase font-bold ${
                                  qty > 0 ? "text-white" : "text-[#4D8A6B]"
                                }`}>
                                  {entry.size_label || "NO SIZE"}
                                </span>
                                <span className={`font-bold [font-family:var(--font-oswald)] text-[16px] ${
                                  qty > 0 ? "text-white" : "text-[#00592B]"
                                }`}>
                                  ₹{entry.price}
                                </span>
                                {qty > 0 ? (
                                  <div className="flex items-center gap-1 ml-1">
                                    <button
                                      onClick={() => handleRemove(entry.product_id, entry.size_id)}
                                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
                                    >
                                      <Minus className="h-5 w-5" />
                                    </button>
                                    <span className="text-[14px] font-bold [font-family:var(--font-oswald)] min-w-[24px] text-center">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => handleAdd(entry)}
                                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
                                    >
                                      <Plus className="h-5 w-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAdd(entry)}
                                    className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#00592B] text-[#00592B] hover:bg-[#00592B] hover:text-white transition-all cursor-pointer"
                                  >
                                    <Plus className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            NO PRICES ADDED FOR THIS SCHOOL YET
          </p>
          <Link href={`/prices?school_id=${id}`}>
            <Button variant="tertiary" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              <span>ADD PRICES</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Sticky cart bar — integrated billing */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:pl-[288px]">
          <div className="mx-auto max-w-4xl space-y-3">
            {/* Top row: cart summary + customer */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 rounded-[12px] bg-[#00592B] border-2 border-black px-4 py-2 shadow-[3px_3px_0_0_#000]">
                <ShoppingCart className="h-5 w-5 text-white shrink-0" />
                <span className="text-[15px] text-white [font-family:var(--font-oswald)] uppercase font-bold whitespace-nowrap">
                  {cartCount} ITEM{cartCount !== 1 ? "S" : ""} — ₹{cartTotal}
                </span>
              </div>
              {quickShowCustomer ? (
                <input
                  value={quickCustomer}
                  onChange={(e) => setQuickCustomer(e.target.value)}
                  placeholder="CUSTOMER NAME"
                  className="h-10 flex-1 min-w-[140px] rounded-[12px] border-2 border-black bg-white px-3 text-[14px] font-bold text-[#00592B] placeholder:text-[#B8AC8A] uppercase [font-family:var(--font-oswald)] outline-none"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setQuickShowCustomer(true)}
                  className="flex items-center gap-1.5 h-10 rounded-[12px] border-2 border-black bg-white px-3 text-[13px] font-bold text-[#4D8A6B] uppercase [font-family:var(--font-oswald)] hover:bg-[#E5F1EA] transition-all cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  CUSTOMER
                </button>
              )}
            </div>

            {/* Bottom row: payment buttons + save */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["cash", "upi", "credit"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setQuickPayment(m)}
                  className={`rounded-[12px] border-2 px-4 py-2.5 text-[14px] font-bold uppercase [font-family:var(--font-oswald)] transition-all cursor-pointer ${
                    quickPayment === m
                      ? "bg-[#00592B] text-white border-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-[#00592B] border-black hover:bg-[#E5F1EA]"
                  }`}
                >
                  {m === "cash" ? "CASH" : m === "upi" ? "UPI" : "CREDIT"}
                </button>
              ))}
              <button
                onClick={() => router.push(`/bills/new?school=${id}`)}
                className="rounded-[12px] border-2 border-black bg-white px-3 py-2.5 text-[12px] font-bold text-[#4D8A6B] uppercase [font-family:var(--font-oswald)] hover:bg-[#E5F1EA] transition-all cursor-pointer"
              >
                MORE
              </button>
              <div className="flex-1" />
              <button
                onClick={quickSave}
                disabled={quickSaving}
                className="flex items-center gap-2 rounded-[16px] border-2 border-black bg-[#00592B] px-6 py-3 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-60"
              >
                <Check className="h-5 w-5 text-white" />
                <span className="text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
                  {quickSaving ? "SAVING..." : "SAVE"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
