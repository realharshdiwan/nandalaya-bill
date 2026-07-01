"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  current_stock: number;
  low_stock_threshold: number;
}

const categoryLabels: Record<string, string> = {
  uniform: "UNIFORM",
  shoes: "SHOES",
  accessories: "ACCESSORIES",
  other: "OTHER",
};

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("uniform");
  const [formStock, setFormStock] = useState("0");
  const [formThreshold, setFormThreshold] = useState("0");
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    const { data } = await supabase.from("products").select("id, name, category, sort_order, current_stock, low_stock_threshold").order("sort_order").order("name");
    setProducts(data || []);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function openAddDialog() {
    setFormName("");
    setFormCategory("uniform");
    setFormStock("0");
    setFormThreshold("0");
    setAddOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormStock(String(product.current_stock));
    setFormThreshold(String(product.low_stock_threshold));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const maxSort = products.reduce((max, p) => Math.max(max, p.sort_order), 0);
    const { error } = await supabase.from("products").insert({
      name: formName,
      category: formCategory,
      sort_order: maxSort + 1,
      current_stock: parseInt(formStock) || 0,
      low_stock_threshold: parseInt(formThreshold) || 0,
    });
    if (error) {
      toast.error("Failed to add product: " + error.message);
    } else {
      setAddOpen(false);
      toast.success("Product added");
      await loadProducts();
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    setLoading(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: formName,
        category: formCategory,
        current_stock: parseInt(formStock) || 0,
        low_stock_threshold: parseInt(formThreshold) || 0,
      })
      .eq("id", editProduct.id);
    if (error) {
      toast.error("Failed to update product: " + error.message);
    } else {
      setEditProduct(null);
      toast.success("Product updated");
      await loadProducts();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    setDeleteLoading(true);

    const { error: priceError } = await supabase
      .from("price_list")
      .update({ is_active: false })
      .eq("product_id", deleteProduct.id)
      .eq("is_active", true);

    if (priceError) {
      toast.error("Failed to deactivate prices: " + priceError.message);
      setDeleteLoading(false);
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", deleteProduct.id);
    if (error) {
      toast.error("Failed to delete product: " + error.message);
    } else {
      toast.success("Product deleted");
      setDeleteProduct(null);
      await loadProducts();
    }
    setDeleteLoading(false);
  }

  async function moveProduct(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const current = products[index];
    const swap = products[newIndex];

    // Swap sort_order values
    await supabase
      .from("products")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id);
    await supabase
      .from("products")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id);

    await loadProducts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            PRODUCTS
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {products.length} PRODUCTS — DRAG TO REORDER FOR BILLING
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          <span>ADD PRODUCT</span>
        </Button>
      </div>

      {products.length > 0 ? (
        <div className="space-y-2">
          {products.map((product, index) => (
            <Card key={product.id}>
              <CardContent className="flex items-center gap-4 p-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveProduct(index, "up")}
                    disabled={index === 0}
                    className="text-[#4D8A6B] hover:text-white disabled:opacity-30 disabled:hover:text-[#4D8A6B]"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => moveProduct(index, "down")}
                    disabled={index === products.length - 1}
                    className="text-[#4D8A6B] hover:text-white disabled:opacity-30 disabled:hover:text-[#4D8A6B]"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B] text-[14px] font-bold text-white [font-family:var(--font-oswald)]">
                  {index + 1}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase text-[16px]">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>
                      {categoryLabels[product.category] || product.category}
                    </Badge>
                    {product.low_stock_threshold > 0 && (
                      <Badge className={product.current_stock <= product.low_stock_threshold ? "bg-[#C42424]" : "bg-[#00592B]"}>
                        STOCK: {product.current_stock}
                        {product.current_stock <= product.low_stock_threshold ? " ⚠ LOW" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditDialog(product)}
                    className="text-[#4D8A6B] hover:text-[#0023D1]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteProduct(product)}
                    className="text-[#4D8A6B] hover:text-[#C42424]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-[#4D8A6B]" />
          <p className="mt-4 text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            NO PRODUCTS YET
          </p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ADD PRODUCT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PRODUCT NAME
              </Label>
              <Input
                placeholder="E.G. SHIRT, PANT, TIE"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                CATEGORY
              </Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "uniform")} items={[{ value: "uniform", label: "UNIFORM" }, { value: "shoes", label: "SHOES" }, { value: "accessories", label: "ACCESSORIES" }, { value: "other", label: "OTHER" }]}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniform">UNIFORM</SelectItem>
                  <SelectItem value="shoes">SHOES</SelectItem>
                  <SelectItem value="accessories">ACCESSORIES</SelectItem>
                  <SelectItem value="other">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                CURRENT STOCK
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                LOW STOCK ALERT THRESHOLD
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0 = no alert"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={loading || !formName}>
                <span>{loading ? "SAVING..." : "SAVE"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EDIT PRODUCT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PRODUCT NAME
              </Label>
              <Input
                placeholder="E.G. SHIRT, PANT, TIE"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                CATEGORY
              </Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "uniform")} items={[{ value: "uniform", label: "UNIFORM" }, { value: "shoes", label: "SHOES" }, { value: "accessories", label: "ACCESSORIES" }, { value: "other", label: "OTHER" }]}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniform">UNIFORM</SelectItem>
                  <SelectItem value="shoes">SHOES</SelectItem>
                  <SelectItem value="accessories">ACCESSORIES</SelectItem>
                  <SelectItem value="other">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                CURRENT STOCK
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                LOW STOCK ALERT THRESHOLD
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0 = no alert"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={loading || !formName}>
                <span>{loading ? "SAVING..." : "UPDATE"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteProduct} onOpenChange={(open) => { if (!open) setDeleteProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE PRODUCT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete &quot;{deleteProduct?.name}&quot;?
            </p>
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              All price entries for this product will be deactivated.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => setDeleteProduct(null)}>
                CANCEL
              </Button>
              <Button onClick={handleDelete} disabled={deleteLoading} className="bg-[#C42424] hover:bg-[#A01C1C]">
                <span>{deleteLoading ? "DELETING..." : "DELETE"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
