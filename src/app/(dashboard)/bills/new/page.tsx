"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Receipt } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  short_code: string | null;
}

interface Product {
  id: string;
  name: string;
  sort_order: number;
}

interface Size {
  id: string;
  label: string;
}

interface PriceEntry {
  product_id: string;
  price: number;
  sizes: Size | null;
}

interface BillItem {
  key: string;
  product_id: string;
  product_name: string;
  size_id: string | null;
  size_label: string;
  qty: number;
  price: number;
  subtotal: number;
  discount_type: "none" | "flat" | "percent";
  discount_value: number;
  discount_amount: number;
  effective_subtotal: number;
}

export default function NewBillPage() {
  const router = useRouter();
  const supabase = createClient();

  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [schoolPrices, setSchoolPrices] = useState<PriceEntry[]>([]);

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [addProductId, setAddProductId] = useState("");
  const [addSizeId, setAddSizeId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addPrice, setAddPrice] = useState("");
  const [addDiscountType, setAddDiscountType] = useState<"none" | "flat" | "percent">("none");
  const [addDiscountValue, setAddDiscountValue] = useState("0");

  useEffect(() => {
    async function load() {
      const [schoolsRes, productsRes, sizesRes] = await Promise.all([
        supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
        supabase.from("products").select("id, name, sort_order").order("sort_order").order("name"),
        supabase.from("sizes").select("id, label").order("numeric_value"),
      ]);
      setSchools(schoolsRes.data || []);
      setProducts(productsRes.data || []);
      setSizes(sizesRes.data || []);
    }
    load();
  }, [supabase]);

  const loadSchoolPrices = useCallback(async (schoolId: string) => {
    if (!schoolId) {
      setSchoolPrices([]);
      return;
    }
    const { data } = await supabase
      .from("price_list")
      .select("product_id, price, sizes(id, label)")
      .eq("school_id", schoolId)
      .eq("is_active", true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = (data || []).map((row: any) => ({
      product_id: row.product_id,
      price: row.price,
      sizes: row.sizes ? (Array.isArray(row.sizes) ? row.sizes[0] : row.sizes) : null,
    }));
    setSchoolPrices(normalized);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchoolPrices(selectedSchool);
  }, [selectedSchool, loadSchoolPrices]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Auto-fill price when product/size/school changes
  useEffect(() => {
    if (!addProductId || !selectedSchool) return;

    // If a size is selected, match product + size
    if (addSizeId) {
      const match = schoolPrices.find(
        (p) => p.product_id === addProductId && p.sizes?.id === addSizeId
      );
      if (match) {
        setAddPrice(String(match.price));
        return;
      }
    }

    // No size selected — look for "no size" price (sizes === null)
    const noSizeMatch = schoolPrices.find(
      (p) => p.product_id === addProductId && p.sizes === null
    );
    if (noSizeMatch) {
      setAddPrice(String(noSizeMatch.price));
    }
  }, [addProductId, addSizeId, schoolPrices, selectedSchool]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function addItem() {
    if (!addProductId || !addQty || !addPrice) {
      toast.error("Fill in product, quantity, and price");
      return;
    }

    const product = products.find((p) => p.id === addProductId);
    const size = addSizeId ? sizes.find((s) => s.id === addSizeId) : null;
    const qty = parseInt(addQty);
    const price = parseFloat(addPrice);

    if (qty <= 0 || price <= 0) {
      toast.error("Quantity and price must be positive");
      return;
    }

    const subtotal = qty * price;
    let discountAmount = 0;
    if (addDiscountType === "flat") {
      discountAmount = parseFloat(addDiscountValue) || 0;
    } else if (addDiscountType === "percent") {
      const pct = parseFloat(addDiscountValue) || 0;
      discountAmount = (subtotal * pct) / 100;
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const newItem: BillItem = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product_id: addProductId,
      product_name: product?.name || "",
      size_id: addSizeId || null,
      size_label: size?.label || "",
      qty,
      price,
      subtotal,
      discount_type: addDiscountType,
      discount_value: parseFloat(addDiscountValue) || 0,
      discount_amount: discountAmount,
      effective_subtotal: subtotal - discountAmount,
    };

    setItems((prev) => [...prev, newItem]);
    setAddProductId("");
    setAddSizeId("");
    setAddQty("1");
    setAddPrice("");
    setAddDiscountType("none");
    setAddDiscountValue("0");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const subtotal = items.reduce((sum, i) => sum + i.effective_subtotal, 0);
  const discountNum = parseFloat(discount) || 0;
  const total = subtotal - discountNum;

  async function handleSave() {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setLoading(true);

    const { data: billNumber, error: bnError } = await supabase.rpc("generate_bill_number");

    if (bnError || !billNumber) {
      toast.error("Failed to generate bill number");
      setLoading(false);
      return;
    }

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        bill_number: billNumber,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        school_id: selectedSchool || null,
        subtotal,
        discount: discountNum,
        total,
        payment_method: paymentMethod,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (billError) {
      toast.error("Failed to create bill: " + billError.message);
      setLoading(false);
      return;
    }

    const billItems = items.map((item) => ({
      bill_id: bill.id,
      product_id: item.product_id,
      size_id: item.size_id || null,
      product_name: item.product_name,
      size_label: item.size_label || null,
      qty: item.qty,
      price: item.price,
      subtotal: item.effective_subtotal,
      discount_type: item.discount_type,
      discount_value: item.discount_value,
      discount_amount: item.discount_amount,
    }));

    const { error: itemsError } = await supabase.from("bill_items").insert(billItems);

    if (itemsError) {
      await supabase.from("bills").delete().eq("id", bill.id);
      toast.error("Failed to save items: " + itemsError.message);
      setLoading(false);
      return;
    }

    toast.success(`Bill ${billNumber} created`);
    router.push(`/bills/${bill.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/bills"
            className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            BILLS
          </Link>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            NEW BILL
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* School */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">SCHOOL (OPTIONAL — FOR PRICE LOOKUP)</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v ?? "")} items={schools.map((s) => ({ value: s.id, label: s.short_code ? `${s.short_code} — ${s.name}` : s.name }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="SELECT SCHOOL FOR AUTO-PRICING" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.short_code ? `${s.short_code} — ${s.name}` : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Add item */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">ADD ITEM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-1">
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PRODUCT</Label>
                  <Select value={addProductId} onValueChange={(v) => setAddProductId(v ?? "")} items={products.map((p) => ({ value: p.id, label: p.name }))}>
                    <SelectTrigger><SelectValue placeholder="PRODUCT" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SIZE (OPTIONAL)</Label>
                  <Select value={addSizeId} onValueChange={(v) => setAddSizeId(v ?? "")} items={sizes.map((s) => ({ value: s.id, label: s.label }))}>
                    <SelectTrigger><SelectValue placeholder="SKIP IF NO SIZE" /></SelectTrigger>
                    <SelectContent>
                      {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">QTY</Label>
                  <Input type="number" min="1" value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PRICE (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4 mt-2">
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DISCOUNT TYPE</Label>
                  <Select value={addDiscountType} onValueChange={(v) => setAddDiscountType((v as "none" | "flat" | "percent") ?? "none")} items={[{ value: "none", label: "NONE" }, { value: "flat", label: "₹ OFF" }, { value: "percent", label: "% OFF" }]}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">NONE</SelectItem>
                      <SelectItem value="flat">₹ OFF</SelectItem>
                      <SelectItem value="percent">% OFF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {addDiscountType !== "none" && (
                  <div>
                    <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                      {addDiscountType === "flat" ? "DISCOUNT (₹)" : "DISCOUNT (%)"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={addDiscountValue}
                      onChange={(e) => setAddDiscountValue(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              <Button onClick={addItem} className="mt-3" disabled={!addProductId}>
                <Plus className="mr-2 h-4 w-4" />
                <span>ADD ITEM</span>
              </Button>
            </CardContent>
          </Card>

          {/* Items */}
          {items.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px]">ITEMS ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 rounded-[12px] border-2 border-black px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                          {item.product_name}
                          {item.size_label && <span className="ml-2 text-[14px] text-[#4D8A6B]">{item.size_label}</span>}
                        </p>
                        <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                          {item.qty} × ₹{item.price} = ₹{item.subtotal}
                          {item.discount_amount > 0 && (
                            <span className="ml-2 text-[#C42424]">
                              -{item.discount_type === "flat" ? `₹${item.discount_value}` : `${item.discount_value}%`} = ₹{item.effective_subtotal}
                            </span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => removeItem(item.key)} className="text-[#4D8A6B] hover:text-[#C42424]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-[#4D8A6B]">
              <Receipt className="mx-auto h-8 w-8 mb-2" />
              <p className="text-[14px] [font-family:var(--font-oswald)] uppercase font-bold">NO ITEMS ADDED YET</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">CUSTOMER (OPTIONAL)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">NAME</Label>
                <Input placeholder="WALK-IN CUSTOMER" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PHONE</Label>
                <Input placeholder="PHONE NUMBER" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">PAYMENT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">METHOD</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "cash")} items={[{ value: "cash", label: "CASH" }, { value: "upi", label: "UPI" }, { value: "card", label: "CARD" }, { value: "credit", label: "CREDIT" }]}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">CASH</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">CARD</SelectItem>
                    <SelectItem value="credit">CREDIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DISCOUNT (₹)</Label>
                <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">NOTES</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-[12px] border-2 border-black bg-white px-3 py-2 text-[14px] font-bold text-[#00592B] placeholder:text-[#4D8A6B] outline-none [font-family:var(--font-oswald)] uppercase"
                rows={2}
                placeholder="OPTIONAL NOTES..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-[#00592B] border-black">
            <CardContent className="space-y-2 p-4">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">SUBTOTAL</span>
                <span className="font-bold text-white [font-family:var(--font-oswald)]">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountNum > 0 && (
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">DISCOUNT</span>
                  <span className="font-bold text-[#E374C7] [font-family:var(--font-oswald)]">-₹{discountNum.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#4D8A6B] pt-2 flex justify-between">
                <span className="font-bold text-white [font-family:var(--font-oswald)] uppercase text-[16px]">TOTAL</span>
                <span className="text-[20px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full h-12 text-[16px]" disabled={loading || items.length === 0}>
            <span>{loading ? "SAVING..." : `SAVE BILL — ₹${total.toFixed(2)}`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
