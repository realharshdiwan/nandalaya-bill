"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
}

interface Size {
  id: string;
  label: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface StockEntry {
  product_id: string;
  size_id: string;
  product_name: string;
  size_label: string;
  total_quantity: number;
  total_value: number;
}

interface InventoryLog {
  id: string;
  product_name: string;
  size_label: string;
  supplier_name: string;
  quantity: number;
  purchase_price: number | null;
  entry_type: string;
  notes: string | null;
  created_at: string;
}

export default function InventoryPage() {
  const supabase = createClient();
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [log, setLog] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formProduct, setFormProduct] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState("purchase");
  const [formNotes, setFormNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const [productsRes, sizesRes, suppliersRes, stockRes, logRes] = await Promise.all([
      supabase.from("products").select("id, name").order("name"),
      supabase.from("sizes").select("id, label").order("numeric_value"),
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("current_stock").select("*"),
      supabase.from("inventory").select("*, products(name), sizes(label), suppliers(name)").order("created_at", { ascending: false }).limit(50),
    ]);

    setProducts(productsRes.data || []);
    setSizes(sizesRes.data || []);
    setSuppliers(suppliersRes.data || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stockData = (stockRes.data || []).map((s: any) => ({
      ...s,
      product_name: productsRes.data?.find((p) => p.id === s.product_id)?.name || "Unknown",
      size_label: sizesRes.data?.find((sz) => sz.id === s.size_id)?.label || "",
    }));
    setStock(stockData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logData = (logRes.data || []).map((l: any) => ({
      ...l,
      product_name: l.products?.name || "Unknown",
      size_label: l.sizes?.label || "",
      supplier_name: l.suppliers?.name || "",
    }));
    setLog(logData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("inventory").insert({
      product_id: formProduct,
      size_id: formSize || null,
      supplier_id: formSupplier || null,
      quantity: formType === "return" ? -Math.abs(parseInt(formQty)) : Math.abs(parseInt(formQty)),
      purchase_price: formPrice ? parseFloat(formPrice) : null,
      entry_type: formType,
      notes: formNotes || null,
    });

    if (error) {
      toast.error("Failed to add entry: " + error.message);
    } else {
      toast.success("Stock entry added");
      setDialogOpen(false);
      setFormProduct("");
      setFormSize("");
      setFormSupplier("");
      setFormQty("");
      setFormPrice("");
      setFormType("purchase");
      setFormNotes("");
      await loadData();
    }
    setLoading(false);
  }

  const totalStock = stock.reduce((sum, s) => sum + s.total_quantity, 0);
  const totalValue = stock.reduce((sum, s) => sum + s.total_value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            INVENTORY
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {totalStock} UNITS • ₹{totalValue.toLocaleString("en-IN")} VALUE
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span>ADD ENTRY</span>
        </Button>
      </div>

      {/* Stock Summary */}
      {stock.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[16px]">STOCK BY PRODUCT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PRODUCT</th>
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">SIZE</th>
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">QTY</th>
                    <th className="pb-2 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold text-right">VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((s, i) => (
                    <tr key={i} className="border-b border-black last:border-0">
                      <td className="py-2.5 font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">{s.product_name}</td>
                      <td className="py-2.5 text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">{s.size_label || "—"}</td>
                      <td className="py-2.5 text-right font-bold text-[#00592B] [font-family:var(--font-oswald)]">{s.total_quantity}</td>
                      <td className="py-2.5 text-right font-bold text-[#00592B] [font-family:var(--font-oswald)]">₹{s.total_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-[#4D8A6B]" />
          <p className="mt-4 text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            NO STOCK ENTRIES YET
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {log.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[16px]">RECENT ACTIVITY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {log.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-[12px] border-2 border-black px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#00592B]">
                    {entry.quantity > 0 ? (
                      <ArrowDown className="h-4 w-4 text-white" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-[#E374C7]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                      {entry.product_name}
                      {entry.size_label && <span className="ml-1 text-[14px] text-[#4D8A6B]">({entry.size_label})</span>}
                    </p>
                    <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                      {entry.entry_type} • {entry.quantity > 0 ? "+" : ""}{entry.quantity} units
                      {entry.supplier_name && ` • ${entry.supplier_name}`}
                    </p>
                  </div>
                  <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                    {new Date(entry.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ADD STOCK ENTRY</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">PRODUCT</Label>
              <Select value={formProduct} onValueChange={(v) => setFormProduct(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="SELECT PRODUCT" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">SIZE (OPTIONAL)</Label>
              <Select value={formSize} onValueChange={(v) => setFormSize(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="SELECT SIZE" /></SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">SUPPLIER (OPTIONAL)</Label>
              <Select value={formSupplier} onValueChange={(v) => setFormSupplier(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="SELECT SUPPLIER" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">ENTRY TYPE</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v ?? "purchase")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">PURCHASE</SelectItem>
                    <SelectItem value="adjustment">ADJUSTMENT</SelectItem>
                    <SelectItem value="return">RETURN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">QUANTITY</Label>
                <Input type="number" min="1" placeholder="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">PURCHASE PRICE PER UNIT (OPTIONAL)</Label>
              <Input type="number" min="0" step="0.01" placeholder="₹" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">NOTES (OPTIONAL)</Label>
              <Input placeholder="NOTES" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={loading || !formProduct || !formQty}>
                <span>{loading ? "SAVING..." : "ADD ENTRY"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
