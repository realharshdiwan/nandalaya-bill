"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Pencil, Trash2, Grid3x3, Layers, Building2 } from "lucide-react";
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
  size_group_id: string | null;
}

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface SchoolGroup {
  id: string;
  name: string;
}

interface PriceEntry {
  id: string;
  school_id: string | null;
  school_group_id: string | null;
  product_id: string;
  size_id: string | null;
  price: number;
  schools: School | null;
  school_groups: SchoolGroup | null;
  products: Product;
  sizes: Size | null;
}

export default function PricesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolGroups, setSchoolGroups] = useState<SchoolGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [mode, setMode] = useState<"school" | "group">("school");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceEntry | null>(null);

  const [formMode, setFormMode] = useState<"school" | "group">("school");
  const [formOwner, setFormOwner] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const loadSizesForProduct = useCallback(async (productId: string) => {
    if (!productId) { setSizes([]); return; }
    const product = products.find((p) => p.id === productId);
    if (!product?.size_group_id) { setSizes([]); return; }
    const { data } = await supabase
      .from("size_group_items")
      .select("sizes(id, label, numeric_value)")
      .eq("size_group_id", product.size_group_id)
      .order("sort_order");
    const resolved = (data || []).map((row) => {
      const s = Array.isArray(row.sizes) ? row.sizes[0] : row.sizes;
      return s ? { id: s.id, label: s.label, numeric_value: s.numeric_value } : null;
    }).filter(Boolean) as Size[];
    setSizes(resolved);
  }, [products, supabase]);

  async function loadData() {
    const [schoolsRes, groupsRes, productsRes] = await Promise.all([
      supabase.from("schools").select("id, name, short_code").eq("is_active", true).order("name"),
      supabase.from("school_groups").select("id, name").order("sort_order"),
      supabase.from("products").select("id, name, category, size_group_id").order("name"),
    ]);

    setSchools(schoolsRes.data || []);
    setSchoolGroups(groupsRes.data || []);
    setProducts(productsRes.data || []);

    await loadPrices();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get("school_id");
    if (schoolId) {
      setSelectedSchool(schoolId);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (formProduct) {
      loadSizesForProduct(formProduct);
    } else {
      setSizes([]);
    }
    setFormSize("");
  }, [formProduct, loadSizesForProduct]);

  async function loadPrices() {
    const { data } = await supabase
      .from("price_list")
      .select(`id, school_id, school_group_id, product_id, size_id, price, 
        schools!left(id, name, short_code), 
        school_groups!left(id, name), 
        products(id, name, category), 
        sizes(id, label, numeric_value)`)
      .eq("is_active", true)
      .order("schools(name)", { nullsFirst: false });

    setPrices(
      ((data as any[]) || []).map((row: any) => ({
        ...row,
        schools: row.schools ? (Array.isArray(row.schools) ? row.schools[0] : row.schools) : null,
        school_groups: row.school_groups ? (Array.isArray(row.school_groups) ? row.school_groups[0] : row.school_groups) : null,
        products: Array.isArray(row.products) ? row.products[0] : row.products,
        sizes: row.sizes ? (Array.isArray(row.sizes) ? row.sizes[0] : row.sizes) : null,
      })) as PriceEntry[]
    );
  }

  const filteredPrices = prices.filter((p) => {
    if (mode === "school") {
      if (p.school_group_id) return false;
      if (selectedSchool !== "all" && p.school_id !== selectedSchool) return false;
      return true;
    } else {
      if (p.school_id) return false;
      if (selectedGroup !== "all" && p.school_group_id !== selectedGroup) return false;
      return true;
    }
  });

  const grouped = filteredPrices.reduce<
    Record<string, Record<string, PriceEntry[]>>
  >((acc, price) => {
    const ownerName = mode === "school"
      ? price.schools?.short_code || price.schools?.name || "Unknown"
      : price.school_groups?.name || "Unknown";
    const productName = price.products?.name || "Unknown";
    if (!acc[ownerName]) acc[ownerName] = {};
    if (!acc[ownerName][productName]) acc[ownerName][productName] = [];
    acc[ownerName][productName].push(price);
    return acc;
  }, {});

  function openAddDialog() {
    setEditingPrice(null);
    setFormMode(mode);
    setFormOwner("");
    setFormProduct("");
    setFormSize("");
    setFormPrice("");
    setDialogOpen(true);
  }

  function openEditDialog(price: PriceEntry) {
    setEditingPrice(price);
    if (price.school_id) {
      setFormMode("school");
      setFormOwner(price.school_id);
    } else {
      setFormMode("group");
      setFormOwner(price.school_group_id || "");
    }
    setFormProduct(price.product_id);
    setFormSize(price.size_id ? price.size_id : "__none__");
    setFormPrice(String(price.price));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const actualSizeId = formSize === "__none__" ? null : formSize;
    const payload: Record<string, any> = {
      product_id: formProduct,
      size_id: actualSizeId,
      price: parseFloat(formPrice),
    };

    if (formMode === "school") {
      payload.school_id = formOwner;
      payload.school_group_id = null;
    } else {
      payload.school_group_id = formOwner;
      payload.school_id = null;
    }

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

  const totalEntries = mode === "school"
    ? prices.filter((p) => !p.school_group_id).length
    : prices.filter((p) => !p.school_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            PRICE LIST
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {totalEntries} PRICES — {mode === "school" ? `${schools.length} SCHOOLS` : `${schoolGroups.length} GROUPS`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/prices/bulk">
            <Button variant="tertiary">
              <Grid3x3 className="mr-2 h-4 w-4" />
              <span>BULK</span>
            </Button>
          </Link>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            <span>ADD PRICE</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-[12px] border-2 border-black overflow-hidden">
          <button
            onClick={() => setMode("school")}
            className={`px-4 py-2 text-[14px] font-bold [font-family:var(--font-oswald)] uppercase cursor-pointer transition-colors ${
              mode === "school" ? "bg-[#00592B] text-white" : "bg-white text-[#00592B] hover:bg-gray-50"
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-1" />
            BY SCHOOL
          </button>
          <button
            onClick={() => setMode("group")}
            className={`px-4 py-2 text-[14px] font-bold [font-family:var(--font-oswald)] uppercase cursor-pointer transition-colors ${
              mode === "group" ? "bg-[#00592B] text-white" : "bg-white text-[#00592B] hover:bg-gray-50"
            }`}
          >
            <Layers className="h-4 w-4 inline mr-1" />
            BY GROUP
          </button>
        </div>

        {mode === "school" ? (
          <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v ?? "all")}>
            <SelectTrigger className="w-full max-w-[250px]">
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
        ) : (
          <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v ?? "all")}>
            <SelectTrigger className="w-full max-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL GROUPS</SelectItem>
              {schoolGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([ownerName, products]) => (
            <Card key={ownerName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[18px]">{ownerName}</CardTitle>
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
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => openEditDialog(entry)}
                                className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#4D8A6B] hover:bg-[#00592B]/10 hover:text-[#0023D1] cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#4D8A6B] hover:bg-[#C42424]/10 hover:text-[#C42424] cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormMode("school")}
                className={`flex-1 py-2 rounded-[8px] text-[14px] font-bold [font-family:var(--font-oswald)] uppercase cursor-pointer transition-colors border-2 ${
                  formMode === "school" ? "bg-[#00592B] text-white border-[#00592B]" : "bg-white text-[#00592B] border-black"
                }`}
              >
                SCHOOL
              </button>
              <button
                type="button"
                onClick={() => setFormMode("group")}
                className={`flex-1 py-2 rounded-[8px] text-[14px] font-bold [font-family:var(--font-oswald)] uppercase cursor-pointer transition-colors border-2 ${
                  formMode === "group" ? "bg-[#00592B] text-white border-[#00592B]" : "bg-white text-[#00592B] border-black"
                }`}
              >
                GROUP
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                {formMode === "school" ? "SCHOOL" : "SCHOOL GROUP"}
              </Label>
              {formMode === "school" ? (
                <Select value={formOwner} onValueChange={(v) => setFormOwner(v ?? "")} required>
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
              ) : (
                <Select value={formOwner} onValueChange={(v) => setFormOwner(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="SELECT GROUP" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PRODUCT
              </Label>
              <Select value={formProduct} onValueChange={(v) => setFormProduct(v ?? "")} required>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT PRODUCT" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                SIZE (OPTIONAL FOR NON-SIZED PRODUCTS)
              </Label>
              <Select value={formSize} onValueChange={(v) => setFormSize(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT SIZE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">NO SIZE</SelectItem>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
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
                disabled={loading || !formOwner || !formProduct || !formPrice}
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
