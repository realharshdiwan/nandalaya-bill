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
import { Plus, Pencil, Trash2, Grid3x3 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  short_code: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface PriceEntry {
  id: string;
  school_id: string;
  product_id: string;
  size_id: string | null;
  price: number;
  schools: School;
  products: Product;
  sizes: Size | null;
}

export default function PricesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceEntry | null>(null);

  const [formSchool, setFormSchool] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get("school_id");
    if (schoolId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSchool(schoolId);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const [schoolsRes, productsRes, sizesRes] = await Promise.all([
      supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
      supabase.from("products").select("id, name, category").order("name"),
      supabase.from("sizes").select("id, label, numeric_value").order("numeric_value"),
    ]);

    setSchools(schoolsRes.data || []);
    setProducts(productsRes.data || []);
    setSizes(sizesRes.data || []);

    await loadPrices();
  }

  async function loadPrices() {
    const { data } = await supabase
      .from("price_list")
      .select("id, school_id, product_id, size_id, price, schools(id, name, short_code), products(id, name, category), sizes(id, label, numeric_value)")
      .eq("is_active", true)
      .order("schools(name)");

    setPrices(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data || []).map((row: any) => ({
        ...row,
        schools: Array.isArray(row.schools) ? row.schools[0] : row.schools,
        products: Array.isArray(row.products) ? row.products[0] : row.products,
        sizes: row.sizes ? (Array.isArray(row.sizes) ? row.sizes[0] : row.sizes) : null,
      })) as PriceEntry[]
    );
  }

  const filteredPrices =
    selectedSchool === "all"
      ? prices
      : prices.filter((p) => p.school_id === selectedSchool);

  const grouped = filteredPrices.reduce<
    Record<string, Record<string, PriceEntry[]>>
  >((acc, price) => {
    const schoolName = price.schools?.short_code || price.schools?.name || "Unknown";
    const productName = price.products?.name || "Unknown";
    if (!acc[schoolName]) acc[schoolName] = {};
    if (!acc[schoolName][productName]) acc[schoolName][productName] = [];
    acc[schoolName][productName].push(price);
    return acc;
  }, {});

  function openAddDialog() {
    setEditingPrice(null);
    setFormSchool("");
    setFormProduct("");
    setFormSize("");
    setFormPrice("");
    setDialogOpen(true);
  }

  function openEditDialog(price: PriceEntry) {
    setEditingPrice(price);
    setFormSchool(price.school_id);
    setFormProduct(price.product_id);
    setFormSize(price.size_id ? price.size_id : "__none__");
    setFormPrice(String(price.price));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const actualSizeId = formSize === "__none__" ? null : formSize;
    const payload = {
      school_id: formSchool,
      product_id: formProduct,
      size_id: actualSizeId,
      price: parseFloat(formPrice),
    };

    if (editingPrice) {
      const { error } = await supabase
        .from("price_list")
        .update(payload)
        .eq("id", editingPrice.id);
      if (error) {
        if (error.code === "23505") {
          toast.error("This price entry already exists");
        } else {
          toast.error("Failed to update price: " + error.message);
        }
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("price_list").insert(payload);
      if (error) {
        if (error.code === "23505") {
          toast.error("This price entry already exists");
        } else {
          toast.error("Failed to add price: " + error.message);
        }
        setLoading(false);
        return;
      }
    }

    setDialogOpen(false);
    await loadPrices();
    setLoading(false);
  }

  async function handleDelete(priceId: string) {
    const { error } = await supabase
      .from("price_list")
      .update({ is_active: false })
      .eq("id", priceId);
    if (error) {
      toast.error("Failed to delete price: " + error.message);
      return;
    }
    toast.success("Price removed");
    await loadPrices();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            PRICE LIST
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {prices.length} PRICES ACROSS {schools.length} SCHOOLS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/prices/bulk">
            <Button variant="tertiary">
              <Grid3x3 className="mr-2 h-4 w-4" />
              <span>BULK ENTRY</span>
            </Button>
          </Link>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            <span>ADD PRICE</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
          FILTER BY SCHOOL:
        </Label>
        <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v ?? "all")} items={[{ value: "all", label: "ALL SCHOOLS" }, ...schools.map((s) => ({ value: s.id, label: s.short_code ? `${s.short_code} — ${s.name}` : s.name }))]}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL SCHOOLS</SelectItem>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.short_code ? `${s.short_code} — ${s.name}` : s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([schoolName, products]) => (
            <Card key={schoolName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[18px]">{schoolName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(products).map(([productName, priceEntries]) => (
                  <div key={productName}>
                    <p className="mb-2 text-[14px] font-bold text-[#003F1E] [font-family:var(--font-oswald)] uppercase">
                      {productName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {priceEntries
                        .sort((a, b) => (a.sizes?.numeric_value || 0) - (b.sizes?.numeric_value || 0))
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="group flex items-center gap-2 rounded-[12px] border-2 border-black px-3 py-2 hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                          >
                            <span className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                              {entry.sizes?.label || "NO SIZE"}
                            </span>
                            <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] text-[16px]">
                              ₹{entry.price}
                            </span>
                            <div className="hidden group-hover:flex items-center gap-1 ml-1">
                              <button
                                onClick={() => openEditDialog(entry)}
                                className="text-[#4D8A6B] hover:text-[#0023D1]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-[#4D8A6B] hover:text-[#C42424]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            NO PRICES FOUND
          </p>
          <Button onClick={openAddDialog} variant="tertiary" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            <span>ADD YOUR FIRST PRICE</span>
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrice ? "EDIT PRICE" : "ADD PRICE"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                SCHOOL
              </Label>
              <Select value={formSchool} onValueChange={(v) => setFormSchool(v ?? "")} required items={schools.map((s) => ({ value: s.id, label: s.short_code ? `${s.short_code} — ${s.name}` : s.name }))}>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT SCHOOL" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.short_code ? `${s.short_code} — ${s.name}` : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PRODUCT
              </Label>
              <Select value={formProduct} onValueChange={(v) => setFormProduct(v ?? "")} required items={products.map((p) => ({ value: p.id, label: p.name }))}>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT PRODUCT" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                SIZE (OPTIONAL FOR NON-SIZED PRODUCTS)
              </Label>
              <Select value={formSize} onValueChange={(v) => setFormSize(v ?? "")} items={[{ value: "__none__", label: "NO SIZE" }, ...sizes.map((s) => ({ value: s.id, label: s.label }))]}>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT SIZE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">NO SIZE</SelectItem>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PRICE (₹)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="E.G. 350"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="submit"
                disabled={loading || !formSchool || !formProduct || !formPrice}
              >
                <span>{loading ? "SAVING..." : editingPrice ? "UPDATE" : "ADD"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
