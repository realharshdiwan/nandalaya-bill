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
import { Settings, Plus, Trash2, Pencil, Smartphone, Users, Shield, ShieldOff, Printer, Wifi, WifiOff, Receipt } from "lucide-react";
import { toast } from "sonner";
import PrinterDialog from "@/components/printer-dialog";
import { isPrinterConnected } from "@/lib/thermal-printer";

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface TeamMember {
  id: string;
  display_name: string | null;
  role: "owner" | "staff";
}

interface ShopConfig {
  legal_name: string;
  shop_address: string;
  shop_phone: string;
  gstin: string;
  state_name: string;
  state_code: string;
  shop_tagline: string;
  tax_type: string;
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
  const [upiId, setUpiId] = useState("");
  const [upiLoading, setUpiLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [shop, setShop] = useState<ShopConfig>({
    legal_name: "", shop_address: "", shop_phone: "", gstin: "",
    state_name: "", state_code: "", shop_tagline: "", tax_type: "composite",
  });
  const [shopLoading, setShopLoading] = useState(false);
  const supabase = createClient();

  async function loadSizes() {
    const { data } = await supabase
      .from("sizes")
      .select("id, label, numeric_value")
      .order("numeric_value");
    setSizes(data || []);
  }

  async function loadUpi() {
    const { data } = await supabase
      .from("shop_config")
      .select("value")
      .eq("key", "upi_id")
      .single();
    if (data) setUpiId(data.value);
  }

  async function loadShop() {
    const { data } = await supabase.from("shop_config").select("key, value");
    if (data) {
      const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
      setShop({
        legal_name: map.legal_name || "",
        shop_address: map.shop_address || "",
        shop_phone: map.shop_phone || "",
        gstin: map.gstin || "",
        state_name: map.state_name || "",
        state_code: map.state_code || "",
        shop_tagline: map.shop_tagline || "",
        tax_type: map.tax_type || "composite",
      });
    }
  }

  async function saveShop() {
    setShopLoading(true);
    const entries = Object.entries(shop);
    const rows = entries.map(([key, value]) => ({ key, value }));
    const { error } = await supabase
      .from("shop_config")
      .upsert(rows, { onConflict: "key" });
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Shop details saved");
    }
    setShopLoading(false);
  }

  async function loadTeam() {
    setTeamLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .order("role");

    if (profiles) {
      setTeamMembers(profiles.map((p) => ({
        id: p.id,
        display_name: p.display_name,
        role: p.role,
      })));
    }
    setTeamLoading(false);
  }

  async function toggleRole(member: TeamMember) {
    const newRole = member.role === "owner" ? "staff" : "owner";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", member.id);

    if (error) {
      toast.error("Failed to update role: " + error.message);
    } else {
      toast.success(`${member.display_name || "User"} is now ${newRole}`);
      await loadTeam();
    }
  }

  async function saveUpi() {
    setUpiLoading(true);
    const { error } = await supabase
      .from("shop_config")
      .upsert({ key: "upi_id", value: upiId }, { onConflict: "key" });
    if (error) {
      toast.error("Failed to save UPI ID: " + error.message);
    } else {
      toast.success("UPI ID saved");
    }
    setUpiLoading(false);
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

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    loadSizes();
    loadUpi();
    loadTeam();
    loadShop();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
          SETTINGS
        </h1>
        <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
          MANAGE YOUR SHOP
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
                <span>✕</span>
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

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            <Smartphone className="h-5 w-5 inline mr-2" />
            PAYMENT SETTINGS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
            UPI ID FOR QR CODE PAYMENTS
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="YOUR-UPI-ID@paytm (e.g. nandalaya@upi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={saveUpi} disabled={upiLoading || !upiId}>
              <span>{upiLoading ? "SAVING..." : "SAVE"}</span>
            </Button>
          </div>
          <p className="text-[12px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
            Set your UPI VPA to generate QR codes on bills for exact-amount payments
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            <Users className="h-5 w-5 inline mr-2" />
            TEAM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
            MANAGE WHO CAN ACCESS THE SYSTEM
          </p>
          {teamLoading ? (
            <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase">LOADING...</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-[12px] border-2 border-black px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
                      {member.display_name || "UNKNOWN USER"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase [font-family:var(--font-oswald)] ${
                      member.role === "owner"
                        ? "bg-[#E374C7] text-white"
                        : "bg-[#0023D1] text-white"
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRole(member)}
                  >
                    {member.role === "owner" ? (
                      <><ShieldOff className="mr-1 h-3 w-3" /><span>DEMOTE</span></>
                    ) : (
                      <><Shield className="mr-1 h-3 w-3" /><span>PROMOTE</span></>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            <Receipt className="h-5 w-5 inline mr-2" />
            SHOP DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">LEGAL NAME</Label>
            <Input placeholder="M/S. YOUR BUSINESS NAME" value={shop.legal_name} onChange={(e) => setShop({ ...shop, legal_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">ADDRESS</Label>
            <Input placeholder="SHOP ADDRESS, CITY - PINCODE" value={shop.shop_address} onChange={(e) => setShop({ ...shop, shop_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">PHONE</Label>
              <Input placeholder="MOBILE NUMBER" value={shop.shop_phone} onChange={(e) => setShop({ ...shop, shop_phone: e.target.value })} />
            </div>
            <div>
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">GSTIN</Label>
              <Input placeholder="GSTIN NUMBER" value={shop.gstin} onChange={(e) => setShop({ ...shop, gstin: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">STATE</Label>
              <Input placeholder="E.G. JHARKHAND" value={shop.state_name} onChange={(e) => setShop({ ...shop, state_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">STATE CODE</Label>
              <Input placeholder="E.G. 20" value={shop.state_code} onChange={(e) => setShop({ ...shop, state_code: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">TAGLINE</Label>
            <Input placeholder="E.G. SCHOOL UNIFORMS & GARMENTS" value={shop.shop_tagline} onChange={(e) => setShop({ ...shop, shop_tagline: e.target.value })} />
          </div>
          <Button onClick={saveShop} disabled={shopLoading || !shop.legal_name}>
            <span>{shopLoading ? "SAVING..." : "SAVE SHOP DETAILS"}</span>
          </Button>
        </CardContent>
      </Card>

      <PrinterSection />

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
                  WARNING: This size is used in {priceCount} price{priceCount !== 1 ? "s" : ""}.
                  Deleting it will permanently remove those prices.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => { setDeleteTarget(null); setPriceCount(0); }}>
                <span>CANCEL</span>
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
                <span>{deleteLoading ? "DELETING..." : "DELETE"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrinterSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = () => setConnected(isPrinterConnected());
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          <Printer className="h-5 w-5 inline mr-2" />
          THERMAL PRINTER
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
          CONNECT A BLUETOOTH THERMAL PRINTER
        </p>
        <div className="flex gap-3 items-center">
          <Button onClick={() => setDialogOpen(true)}>
            {connected ? (
              <><WifiOff className="mr-1 h-4 w-4" /><span>MANAGE</span></>
            ) : (
              <><Wifi className="mr-1 h-4 w-4" /><span>CONNECT</span></>
            )}
          </Button>
          {connected && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00592B] px-3 py-1 text-[12px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              CONNECTED
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase">
          Works with ESC/POS compatible Bluetooth thermal printers (80mm or 58mm). Connect once here, then use the THERMAL button on any bill to print receipts.
        </p>
      </CardContent>
      <PrinterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
