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
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

export default function SuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSuppliers() {
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
  }

  function openAddDialog() {
    setEditingSupplier(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setDialogOpen(true);
  }

  function openEditDialog(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormPhone(supplier.phone || "");
    setFormAddress(supplier.address || "");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { name: formName, phone: formPhone || null, address: formAddress || null };

    if (editingSupplier) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editingSupplier.id);
      if (error) {
        toast.error("Failed to update supplier: " + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) {
        toast.error("Failed to add supplier: " + error.message);
        setLoading(false);
        return;
      }
    }

    toast.success(editingSupplier ? "Supplier updated" : "Supplier added");
    setDialogOpen(false);
    await loadSuppliers();
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const { error } = await supabase.from("suppliers").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete supplier: " + error.message);
    } else {
      toast.success("Supplier deleted");
      setDeleteTarget(null);
      await loadSuppliers();
    }
    setDeleteLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
            SUPPLIERS
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {suppliers.length} SUPPLIERS
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          <span>ADD SUPPLIER</span>
        </Button>
      </div>

      {suppliers.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase text-[16px]">
                      {supplier.name}
                    </p>
                    {supplier.phone && (
                      <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                        {supplier.phone}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold truncate">
                        {supplier.address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditDialog(supplier)} className="text-[#4D8A6B] hover:text-[#0023D1]">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(supplier)} className="text-[#4D8A6B] hover:text-[#C42424]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-[#4D8A6B]" />
          <p className="mt-4 text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            NO SUPPLIERS YET
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "EDIT SUPPLIER" : "ADD SUPPLIER"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">NAME</Label>
              <Input placeholder="SUPPLIER NAME" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">PHONE (OPTIONAL)</Label>
              <Input placeholder="PHONE NUMBER" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">ADDRESS (OPTIONAL)</Label>
              <Input placeholder="ADDRESS" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={loading || !formName}>
                <span>{loading ? "SAVING..." : editingSupplier ? "UPDATE" : "ADD"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE SUPPLIER</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => setDeleteTarget(null)}><span>CANCEL</span></Button>
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
