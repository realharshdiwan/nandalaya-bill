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
import { ArrowLeft, Plus, Pencil, ShoppingCart, Minus } from "lucide-react";
import DeleteSchoolButton from "./delete-school-button";
import { addToCart, getCart, removeFromCart, CartItem } from "@/lib/cart";

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

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [school, setSchool] = useState<School | null>(null);
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("id, name, short_code, address, phone")
        .eq("id", id)
        .single();

      if (!schoolData) {
        setLoading(false);
        return;
      }
      setSchool(schoolData);

      const { data: priceList } = await supabase
        .from("price_list")
        .select("id, price, products(id, name, category), sizes(id, label, numeric_value)")
        .eq("school_id", id)
        .eq("is_active", true)
        .order("products(name)");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (priceList || []).map((pl: any) => ({
        ...pl,
        products: Array.isArray(pl.products) ? pl.products[0] : pl.products,
        sizes: Array.isArray(pl.sizes) ? pl.sizes[0] : pl.sizes,
      }));

      const productMap: Record<string, ProductGroup> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normalized.forEach((pl: any) => {
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

      setProducts(Object.values(productMap));
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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/schools"
            className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            SCHOOLS
          </Link>
          <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/schools/${id}/edit`}>
            <Button variant="tertiary">
              <Pencil className="mr-2 h-4 w-4" />
              <span>EDIT</span>
            </Button>
          </Link>
          <DeleteSchoolButton schoolId={id} schoolName={school.name} />
          <Link href={`/prices?school_id=${id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span>ADD PRICE</span>
            </Button>
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
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
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-[13px] font-bold [font-family:var(--font-oswald)] min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleAdd(entry)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(entry)}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#00592B] text-[#00592B] hover:bg-[#00592B] hover:text-white transition-all cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
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

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:pl-[288px]">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => router.push(`/bills/new?school=${id}`)}
              className="w-full flex items-center justify-between rounded-[16px] border-2 border-black bg-[#00592B] px-6 py-4 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
                  {cartCount} ITEM{cartCount !== 1 ? "S" : ""} — ₹{cartTotal}
                </span>
              </div>
              <span className="text-[16px] text-[#E374C7] [font-family:var(--font-oswald)] uppercase font-bold">
                CREATE BILL →
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
