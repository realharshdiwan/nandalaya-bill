"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Receipt, User, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getCart, clearCart } from "@/lib/cart";
import { getSchools, getProducts, getShopConfig, getPricesForSchool, getSizesForProduct, generateBillNumber, createBillOffline, decrementStock } from "@/lib/data";

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

  const [schools, setSchools] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [schoolPrices, setSchoolPrices] = useState<any[]>([]);

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDefaultLoaded, setPaymentDefaultLoaded] = useState(false);
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [splitCredit, setSplitCredit] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [addProductId, setAddProductId] = useState("");
  const [addSizeId, setAddSizeId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addPrice, setAddPrice] = useState("");
  const [addDiscountType, setAddDiscountType] = useState<"none" | "flat" | "percent">("none");
  const [addDiscountValue, setAddDiscountValue] = useState("0");
  const [showItemDiscount, setShowItemDiscount] = useState(false);

  const loadSizesForProduct = useCallback(async (productId: string) => {
    if (!productId) { setSizes([]); return; }
    const resolved = await getSizesForProduct(productId);
    setSizes(resolved);
  }, []);

  useEffect(() => {
    async function load() {
      const [schoolsData, productsData] = await Promise.all([
        getSchools(),
        getProducts(),
      ]);
      setSchools(schoolsData);
      setProducts(productsData);

      // Check for pre-loaded cart from school detail page
      const cartItems = getCart();
      const params = new URLSearchParams(window.location.search);
      const schoolParam = params.get("school");

      // Load default payment method from shop config
      const config = await getShopConfig("default_payment");
      if (config) {
        setPaymentMethod(config);
      }
      setPaymentDefaultLoaded(true);

      if (cartItems.length > 0 && schoolParam) {
        setSelectedSchool(schoolParam);

        const newBillItems: BillItem[] = cartItems.map((ci) => {
          const product = productsData.find((p) => p.id === ci.product_id);
          const subtotal = ci.qty * ci.price;
          return {
            key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            product_id: ci.product_id,
            product_name: ci.product_name || product?.name || "",
            size_id: ci.size_id,
            size_label: ci.size_label,
            qty: ci.qty,
            price: ci.price,
            subtotal,
            discount_type: "none" as const,
            discount_value: 0,
            discount_amount: 0,
            effective_subtotal: subtotal,
          };
        });

        setItems(newBillItems);
        clearCart();
        toast.success(`Loaded ${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} from cart`);
      }
    }
    load();
  }, []);

  const loadSchoolPrices = useCallback(async (schoolId: string) => {
    if (!schoolId) {
      setSchoolPrices([]);
      return;
    }

    const prices = await getPricesForSchool(schoolId);
    setSchoolPrices(prices.map((p: any) => ({
      product_id: p.product_id,
      price: p.price,
      sizes: (p as any).sizes || null,
    })));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchoolPrices(selectedSchool);
  }, [selectedSchool, loadSchoolPrices]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Load sizes when product changes
  useEffect(() => {
    if (addProductId) {
      loadSizesForProduct(addProductId);
    } else {
      setSizes([]);
    }
    setAddSizeId("");
  }, [addProductId, loadSizesForProduct]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

    // Stock validation
    if (product && product.current_stock > 0 && qty > product.current_stock) {
      toast.warning(`Only ${product.current_stock} in stock for ${product.name}`);
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

  function updateItemQty(key: string, delta: number) {
    setItems((prev) => prev.map((item) => {
      if (item.key !== key) return item;
      const newQty = Math.max(1, item.qty + delta);
      const newSubtotal = newQty * item.price;
      let newDiscountAmount = 0;
      if (item.discount_type === "flat") {
        newDiscountAmount = item.discount_value;
      } else if (item.discount_type === "percent") {
        newDiscountAmount = (newSubtotal * item.discount_value) / 100;
      }
      newDiscountAmount = Math.min(newDiscountAmount, newSubtotal);
      return {
        ...item,
        qty: newQty,
        subtotal: newSubtotal,
        discount_amount: newDiscountAmount,
        effective_subtotal: newSubtotal - newDiscountAmount,
      };
    }));
  }

  const subtotal = items.reduce((sum, i) => sum + i.effective_subtotal, 0);
  const discountNum = parseFloat(discount) || 0;
  const total = subtotal - discountNum;

  async function handleSave() {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    if (paymentMethod === "split") {
      const cashAmt = parseFloat(splitCash) || 0;
      const upiAmt = parseFloat(splitUpi) || 0;
      const creditAmt = parseFloat(splitCredit) || 0;
      const splitTotal = cashAmt + upiAmt + creditAmt;
      if (Math.abs(splitTotal - total) >= 0.01) {
        toast.error(`Payment amounts (₹${splitTotal.toFixed(2)}) don't match bill total (₹${total.toFixed(2)})`);
        return;
      }
      if (splitTotal === 0) {
        toast.error("Enter at least one payment amount");
        return;
      }
    }

    setLoading(true);

    const billNumber = await generateBillNumber();
    if (!billNumber) {
      toast.error("Failed to generate bill number");
      setLoading(false);
      return;
    }

    const billIsPaid = paymentMethod !== "credit" && !(paymentMethod === "split" && parseFloat(splitCredit) > 0);

    try {
      const bill = await createBillOffline(
        {
          bill_number: billNumber,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          school_id: selectedSchool || null,
          subtotal,
          discount: discountNum,
          total,
          payment_method: paymentMethod,
          payment_details: paymentMethod === "split" ? (() => {
            const details: { method: string; amount: number }[] = [];
            const cashAmt = parseFloat(splitCash) || 0;
            const upiAmt = parseFloat(splitUpi) || 0;
            const creditAmt = parseFloat(splitCredit) || 0;
            if (cashAmt > 0) details.push({ method: "cash", amount: cashAmt });
            if (upiAmt > 0) details.push({ method: "upi", amount: upiAmt });
            if (creditAmt > 0) details.push({ method: "credit", amount: creditAmt });
            return details.length > 0 ? details : null;
          })() : null,
          notes: notes || null,
          is_paid: billIsPaid,
          paid_at: billIsPaid ? new Date().toISOString() : null,
          status: "active",
        },
        items.map((item) => ({
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
        }))
      );

      for (const item of items) {
        if (item.qty > 0) {
          await decrementStock(item.product_id, item.qty);
        }
      }

      toast.success(`Bill ${billNumber} created`);
      router.push(`/bills/${(bill as any).id}${billIsPaid ? "?autoprint=true" : ""}`);
    } catch (err: any) {
      toast.error("Failed to create bill: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pb-24">
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {/* School — compact */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SCHOOL (OPTIONAL)</Label>
              <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v ?? "")} items={schools.map((s) => ({ value: s.id, label: s.short_code ? `${s.short_code} — ${s.name}` : s.name }))}>
                <SelectTrigger className="w-full mt-1">
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
            <CardContent className="p-4 space-y-3">
              <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">ADD ITEM</Label>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Select value={addProductId} onValueChange={(v) => setAddProductId(v ?? "")} items={products.map((p) => ({ value: p.id, label: p.name }))}>
                    <SelectTrigger><SelectValue placeholder="PRODUCT" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={addSizeId} onValueChange={(v) => setAddSizeId(v ?? "")} items={sizes.map((s) => ({ value: s.id, label: s.label }))}>
                    <SelectTrigger><SelectValue placeholder="SIZE" /></SelectTrigger>
                    <SelectContent>
                      {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min="1" value={addQty} onChange={(e) => setAddQty(e.target.value)} placeholder="QTY" />
                  <Input type="number" min="0" step="0.01" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="₹ PRICE" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                {showItemDiscount && (
                  <>
                    <div className="w-32">
                      <Select value={addDiscountType} onValueChange={(v) => setAddDiscountType((v as "none" | "flat" | "percent") ?? "none")} items={[{ value: "none", label: "NO DISCOUNT" }, { value: "flat", label: "₹ OFF" }, { value: "percent", label: "% OFF" }]}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">NO DISCOUNT</SelectItem>
                          <SelectItem value="flat">₹ OFF</SelectItem>
                          <SelectItem value="percent">% OFF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {addDiscountType !== "none" && (
                      <Input
                        type="number" min="0" step="0.01"
                        value={addDiscountValue}
                        onChange={(e) => setAddDiscountValue(e.target.value)}
                        placeholder={addDiscountType === "flat" ? "₹" : "%"}
                        className="h-9 w-24 text-[13px]"
                      />
                    )}
                  </>
                )}
                <Button
                  onClick={() => setShowItemDiscount(!showItemDiscount)}
                  variant="tertiary"
                  size="xs"
                  className="text-[11px]"
                >
                  {showItemDiscount ? "HIDE DISC" : "DISC"}
                </Button>
                <Button onClick={addItem} disabled={!addProductId} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  <span>ADD</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items list */}
          {items.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 rounded-[12px] border-2 border-black px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase text-[15px] truncate">
                          {item.product_name}
                          {item.size_label && <span className="ml-1 text-[13px] text-[#4D8A6B]">({item.size_label})</span>}
                        </p>
                        <p className="text-[13px] text-[#003F1E] [font-family:var(--font-oswald)] uppercase font-bold">
                          ₹{item.price} × {item.qty} = ₹{item.effective_subtotal}
                          {item.discount_amount > 0 && (
                            <span className="ml-1 text-[#C42424]">
                              (-{item.discount_type === "flat" ? `₹${item.discount_value}` : `${item.discount_value}%`})
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Quick increment buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateItemQty(item.key, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00592B]/10 text-[#00592B] hover:bg-[#00592B]/20 cursor-pointer"
                        >
                          <span className="text-[18px] font-bold leading-none">−</span>
                        </button>
                        <span className="w-8 text-center text-[15px] font-bold [font-family:var(--font-oswald)] text-[#00592B]">{item.qty}</span>
                        <button
                          onClick={() => updateItemQty(item.key, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00592B]/10 text-[#00592B] hover:bg-[#00592B]/20 cursor-pointer"
                        >
                          <span className="text-[18px] font-bold leading-none">+</span>
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#4D8A6B] hover:bg-[#C42424]/10 hover:text-[#C42424] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-[#4D8A6B] rounded-[20px] border-2 border-dashed border-[#4D8A6B]/30">
              <Receipt className="mx-auto h-8 w-8 mb-2" />
              <p className="text-[14px] [font-family:var(--font-oswald)] uppercase font-bold">ADD ITEMS TO START</p>
            </div>
          )}

          {/* Save button on left column */}
          {items.length > 0 && (
            <Button onClick={handleSave} className="w-full h-12 text-[16px] md:hidden" disabled={loading}>
              <span>{loading ? "SAVING..." : `SAVE BILL — ₹${total.toFixed(2)}`}</span>
            </Button>
          )}
        </div>

        {/* Right column — payment and summary */}
        <div className="space-y-4">
          {/* Customer — collapsed by default */}
          <button
            onClick={() => setShowCustomer(!showCustomer)}
            className="w-full flex items-center justify-between rounded-[20px] border-2 border-black bg-white px-4 py-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#00592B]" />
              <span className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                {customerName || customerPhone ? `${customerName || "WALK-IN"}${customerPhone ? ` • ${customerPhone}` : ""}` : "ADD CUSTOMER (OPTIONAL)"}
              </span>
            </div>
            <span className="text-[14px] text-[#4D8A6B]">{showCustomer ? "▲" : "▼"}</span>
          </button>
          {showCustomer && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">NAME</Label>
                  <Input placeholder="WALK-IN CUSTOMER" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PHONE</Label>
                  <Input placeholder="PHONE NUMBER" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment — big buttons */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PAYMENT</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "upi", "card", "credit", "split"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-[12px] border-2 px-3 py-2.5 text-[14px] font-bold uppercase [font-family:var(--font-oswald)] transition-all cursor-pointer ${
                      paymentMethod === m
                        ? "bg-[#00592B] text-white border-[#00592B] shadow-[2px_2px_0_0_#000]"
                        : "bg-white text-[#00592B] border-black hover:bg-[#E5F1EA]"
                    }`}
                  >
                    {m === "cash" ? "CASH" : m === "upi" ? "UPI" : m === "card" ? "CARD" : m === "credit" ? "CREDIT" : "SPLIT"}
                  </button>
                ))}
              </div>

              {paymentMethod === "split" && (
                <div className="space-y-2 rounded-[12px] border-2 border-[#E374C7] bg-pink-50 p-3">
                  <p className="text-[13px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold">
                    TOTAL: ₹{total.toFixed(2)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold w-14">CASH</span>
                      <Input type="number" min="0" step="0.01" placeholder="0" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} className="flex-1 h-10" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold w-14">UPI</span>
                      <Input type="number" min="0" step="0.01" placeholder="0" value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} className="flex-1 h-10" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#00592B] [font-family:var(--font-oswald)] uppercase font-bold w-14">CREDIT</span>
                      <Input type="number" min="0" step="0.01" placeholder="0" value={splitCredit} onChange={(e) => setSplitCredit(e.target.value)} className="flex-1 h-10" />
                    </div>
                  </div>
                  {(() => {
                    const cashAmt = parseFloat(splitCash) || 0;
                    const upiAmt = parseFloat(splitUpi) || 0;
                    const creditAmt = parseFloat(splitCredit) || 0;
                    const splitTotal = cashAmt + upiAmt + creditAmt;
                    const matches = Math.abs(splitTotal - total) < 0.01;
                    return (
                      <div className={`flex justify-between items-center text-[13px] font-bold [font-family:var(--font-oswald)] uppercase ${
                        matches ? "text-[#00592B]" : "text-[#C42424]"
                      }`}>
                        <span>₹{splitTotal.toFixed(2)}</span>
                        <span>{matches ? "✓ OK" : `₹${(total - splitTotal).toFixed(2)} LEFT`}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <Label className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">DISCOUNT (₹)</Label>
                <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Notes — collapsed by default */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between rounded-[20px] border-2 border-black bg-white px-4 py-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#00592B]" />
              <span className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                {notes ? `NOTES: ${notes.slice(0, 30)}${notes.length > 30 ? "..." : ""}` : "ADD NOTES (OPTIONAL)"}
              </span>
            </div>
            <span className="text-[14px] text-[#4D8A6B]">{showNotes ? "▲" : "▼"}</span>
          </button>
          {showNotes && (
            <Card>
              <CardContent className="p-4">
                <textarea
                  className="w-full rounded-[12px] border-2 border-black bg-white px-3 py-2 text-[14px] font-bold text-[#00592B] placeholder:text-[#4D8A6B] outline-none [font-family:var(--font-oswald)] uppercase"
                  rows={2}
                  placeholder="OPTIONAL NOTES..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {/* Total + Save — sticky at bottom */}
          <div className="sticky bottom-4 space-y-3">
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
                  <span className="text-[22px] font-bold text-[#E374C7] [font-family:var(--font-oswald)]">₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full h-12 text-[16px]" disabled={loading || items.length === 0}>
              <span>{loading ? "SAVING..." : `SAVE BILL — ₹${total.toFixed(2)}`}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
