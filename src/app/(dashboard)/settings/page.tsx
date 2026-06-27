"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Settings, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

export default function SettingsPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newNumeric, setNewNumeric] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Size | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [priceCount, setPriceCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadSizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSizes() {
    const { data } = await supabase
      .from("sizes")
      .select("id, label, numeric_value")
      .order("numeric_value");
    setSizes(data || []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("sizes").insert({
      label: newLabel,
      numeric_value: newNumeric ? parseFloat(newNumeric) : null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("This size already exists");
      } else {
        toast.error("Failed to add size: " + error.message);
      }
    } else {
      setNewLabel("");
      setNewNumeric("");
      await loadSizes();
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSize) return;
    setLoading(true);

    const { error } = await supabase
      .from("sizes")
      .update({
        label: newLabel,
        numeric_value: newNumeric ? parseFloat(newNumeric) : null,
      })
      .eq("id", editingSize.id);

    if (error) {
      if (error.code === "23505") {
        toast.error("This size already exists");
      } else {
        toast.error("Failed to update size: " + error.message);
      }
    } else {
      setEditingSize(null);
      setNewLabel("");
      setNewNumeric("");
      await loadSizes();
    }
    setLoading(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    await supabase
      .from("price_list")
      .update({ is_active: false })
      .eq("size_id", deleteTarget.id)
      .eq("is_active", true);

    const { error } = await supabase.from("sizes").delete().eq("id", deleteTarget.id);

    if (error) {
      toast.error("Failed to delete size: " + error.message);
    } else {
      toast.success(`Size "${deleteTarget.label}" deleted`);
      setDeleteTarget(null);
      await loadSizes();
    }
    setDeleteLoading(false);
  }

  async function openDeleteDialog(size: Size) {
    setDeleteTarget(size);
    const { count } = await supabase
      .from("price_list")
      .select("id", { count: "exact", head: true })
      .eq("size_id", size.id)
      .eq("is_active", true);
    setPriceCount(count || 0);
  }

  function openEditDialog(size: Size) {
    setEditingSize(size);
    setNewLabel(size.label);
    setNewNumeric(size.numeric_value !== null ? String(size.numeric_value) : "");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
          SETTINGS
        </h1>
        <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
          MANAGE YOUR SIZES
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            <Settings className="h-5 w-5 inline mr-2" />
            SIZES
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={editingSize ? handleEdit : handleAdd} className="flex gap-3">
            <Input
              placeholder="SIZE LABEL (E.G. 28, M, L)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="SORT ORDER"
              value={newNumeric}
              onChange={(e) => setNewNumeric(e.target.value)}
              className="w-24"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={loading || !newLabel}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {editingSize && (
              <Button
                type="button"
                size="icon"
                variant="tertiary"
                className="shrink-0"
                onClick={() => {
                  setEditingSize(null);
                  setNewLabel("");
                  setNewNumeric("");
                }}
              >
                ✕
              </Button>
            )}
          </form>

          <div className="space-y-2">
            {sizes.map((size) => (
              <div
                key={size.id}
                className="flex items-center justify-between rounded-[12px] border-2 border-black px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                    {size.label}
                  </span>
                  {size.numeric_value !== null && (
                    <span className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                      ORDER: {size.numeric_value}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDialog(size)}
                    className="text-[#4D8A6B] hover:text-[#0023D1]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(size)}
                    className="text-[#4D8A6B] hover:text-[#C42424]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setPriceCount(0); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE SIZE</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete size &quot;{deleteTarget?.label}&quot;?
            </p>
            {priceCount > 0 && (
              <div className="rounded-[12px] border-2 border-[#C42424] bg-red-50 p-3">
                <p className="text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase">
                  ⚠ WARNING: This size is used in {priceCount} price{priceCount !== 1 ? "s" : ""}.
                  Deleting it will permanently remove those prices.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => { setDeleteTarget(null); setPriceCount(0); }}>
                CANCEL
              </Button>
              <Button onClick={confirmDelete} disabled={deleteLoading} className="bg-[#C42424] hover:bg-[#A01C1C]">
                <span>{deleteLoading ? "DELETING..." : "DELETE"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
