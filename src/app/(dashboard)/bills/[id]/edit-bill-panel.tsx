"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  sizes: { id: string; label: string } | null;
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
  existing_id?: string;
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

export default function EditBillPanel({
  bill,
  existingItems,
  onClose,
}: {
  bill: BillData;
  existingItems: ExistingItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [schoolPrices, setSchoolPrices] = useState<PriceEntry[]>([]);

  const [customerName, setCustomerName] = useState(bill.customer_name || "");
  const [customerPhone, setCustomerPhone] = useState(bill.customer_phone || "");
  const [discount, setDiscount] = useState(String(bill.discount || 0));
  const [notes, setNotes] = useState(bill.notes || "");
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
      const [productsRes, sizesRes, pricesRes] = await Promise.all([
        supabase.from("products").select("id, name, sort_order").order("sort_order").order("name"),
        supabase.from("sizes").select("id, label").order("numeric_value"),
        bill.school_id
          ? supabase.from("price_list").select("product_id, price, sizes(id, label)").eq("school_id", bill.school_id).eq("is_active", true)
          : Promise.resolve({ data: [] }),
      ]);
      setProducts(productsRes.data || []);
      setSizes(sizesRes.data || []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (pricesRes.data || []).map((row: any) => ({
        product_id: row.product_id,
        price: row.price,
        sizes: row.sizes ? (Array.isArray(row.sizes) ? row.sizes[0] : row.sizes) : null,
      }));
      setSchoolPrices(normalized);

      // Convert existing items to BillItem format
      const converted: BillItem[] = existingItems.map((ei) => ({
        key: ei.id,
        existing_id: ei.id,
        product_id: ei.product_id,
        product_name: ei.product_name,
        size_id: ei.size_id,
        size_label: ei.size_label || "",
        qty: ei.qty,
        price: ei.price,
        subtotal: ei.subtotal,
        discount_type: (ei.discount_type || "none") as "none" | "flat" | "percent",
        discount_value: ei.discount_value || 0,
        discount_amount: ei.discount_amount || 0,
        effective_subtotal: ei.subtotal - (ei.discount_amount || 0),
      }));
      setItems(converted);
    }
    load();
  }, [supabase, bill.school_id, existingItems]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!addProductId || !bill.school_id) return;

    if (addSizeId) {
      const match = schoolPrices.find(
        (p) => p.product_id === addProductId && p.sizes?.id === addSizeId
      );
      if (match) {
        setAddPrice(String(match.price));
        return;
      }
    }

    const noSizeMatch = schoolPrices.find(
      (p) => p.product_id === addProductId && p.sizes === null
    );
    if (noSizeMatch) {
      setAddPrice(String(noSizeMatch.price));
    }
  }, [addProductId, addSizeId, schoolPrices, bill.school_id]);
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

    // Collect existing item IDs that are still present
    const keptExistingIds = items
      .filter((i) => i.existing_id)
      .map((i) => i.existing_id!);

    // 1. Delete removed items
    if (keptExistingIds.length < existingItems.length) {
      const idsToDelete = existingItems
        .filter((ei) => !keptExistingIds.includes(ei.id))
        .map((ei) => ei.id);

      if (idsToDelete.length > 0) {
        const { error } = await supabase.from("bill_items").delete().in("id", idsToDelete);
        if (error) {
          toast.error("Failed to remove items: " + error.message);
          setLoading(false);
          return;
        }
      }
    }

    // 2. Insert new items
    const newItems = items.filter((i) => !i.existing_id);
    if (newItems.length > 0) {
      const billItems = newItems.map((item) => ({
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

      const { error } = await supabase.from("bill_items").insert(billItems);
      if (error) {
        toast.error("Failed to add items: " + error.message);
        setLoading(false);
        return;
      }
    }

    // 3. Update bill totals and customer info
    const { error: updateError } = await supabase
      .from("bills")
      .update({
        subtotal,
        discount: discountNum,
        total,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: notes || null,
      })
      .eq("id", bill.id);

    if (updateError) {
      toast.error("Failed to update bill: " + updateError.message);
      setLoading(false);
      return;
    }

    toast.success("Bill updated");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-10 no-print">
      <div className="bg-[#C5D6BE] w-full max-w-2xl mx-4 space-y-4 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#00592B]" />
            <h2 className="text-[20px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              EDIT BILL
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span>CANCEL</span>
          </Button>
        </div>

        {/* Customer info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px]">CUSTOMER</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">NAME</Label>
                <Input placeholder="WALK-IN CUSTOMER" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PHONE</Label>
                <Input placeholder="PHONE NUMBER" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px]">ITEMS ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-[12px] border-2 border-black px-3 py-2.5 bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                      {item.product_name}
                      {item.size_label && <span className="ml-2 text-[14px] text-[#4D8A6B]">{item.size_label}</span>}
                    </p>
                    <p className="text-[14px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                      {item.qty} × ₹{item.price} = ₹{item.effective_subtotal}
                      {item.discount_amount > 0 && (
                        <span className="ml-2 text-[#C42424]">
                          -{item.discount_type === "flat" ? `₹${item.discount_value}` : `${item.discount_value}%`}
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

        {/* Add new item */}
        {bill.school_id && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px]">ADD ITEM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PRODUCT</Label>
                  <Select value={addProductId} onValueChange={(v) => setAddProductId(v ?? "")} items={products.map((p) => ({ value: p.id, label: p.name }))}>
                    <SelectTrigger><SelectValue placeholder="PRODUCT" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SIZE</Label>
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
                    <Input type="number" min="0" step="0.01" value={addDiscountValue} onChange={(e) => setAddDiscountValue(e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              <Button onClick={addItem} className="mt-3" disabled={!addProductId}>
                <Plus className="mr-2 h-4 w-4" />
                <span>ADD ITEM</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {!bill.school_id && (
          <Card>
            <CardContent className="p-4">
              <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                This bill has no school assigned. Enter prices manually for new items.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Discount + Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">BILL DISCOUNT (₹)</Label>
                <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">NOTES</Label>
              <textarea
                className="w-full mt-1 rounded-[12px] border-2 border-black bg-white px-3 py-2 text-[14px] font-bold text-[#00592B] placeholder:text-[#4D8A6B] outline-none [font-family:var(--font-oswald)] uppercase"
                rows={2}
                placeholder="OPTIONAL NOTES..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Totals */}
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

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <span>CANCEL</span>
          </Button>
          <Button onClick={handleSave} disabled={loading || items.length === 0}>
            <span>{loading ? "SAVING..." : "SAVE CHANGES"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
