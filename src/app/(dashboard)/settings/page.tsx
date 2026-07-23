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
import { Settings, Plus, Trash2, Pencil, Smartphone, Users, Shield, ShieldOff, Printer, Wifi, WifiOff, Receipt, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PrinterDialog from "@/components/printer-dialog";
import { isPrinterConnected } from "@/lib/thermal-printer";

interface Size {
  id: string;
  label: string;
  numeric_value: number | null;
}

interface SizeGroup {
  id: string;
  name: string;
  sort_order: number;
  sizes: Size[];
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
  const supabase = createClient();

  // Size groups
  const [groups, setGroups] = useState<SizeGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<SizeGroup | null>(null);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);

  // Sizes within groups
  const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});
  const [sizeSortInputs, setSizeSortInputs] = useState<Record<string, string>>({});
  const [addingSizeTo, setAddingSizeTo] = useState<string | null>(null);
  const [deleteSizeTarget, setDeleteSizeTarget] = useState<{ size: Size; groupName: string } | null>(null);
  const [deleteSizeLoading, setDeleteSizeLoading] = useState(false);
  const [deleteSizePriceCount, setDeleteSizePriceCount] = useState(0);

  // Other settings
  const [upiId, setUpiId] = useState("");
  const [upiLoading, setUpiLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [shop, setShop] = useState<ShopConfig>({
    legal_name: "", shop_address: "", shop_phone: "", gstin: "",
    state_name: "", state_code: "", shop_tagline: "", tax_type: "composite",
  });
  const [shopLoading, setShopLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    const { data: groupsData } = await supabase
      .from("size_groups")
      .select("id, name, sort_order")
      .order("sort_order");

    if (!groupsData) {
      setGroups([]);
      return;
    }

    const { data: itemsData } = await supabase
      .from("size_group_items")
      .select("size_group_id, sizes(id, label, numeric_value)")
      .order("sort_order");

    const itemsByGroup: Record<string, Size[]> = {};
    for (const item of itemsData || []) {
      const size = Array.isArray(item.sizes) ? item.sizes[0] : item.sizes;
      if (!itemsByGroup[item.size_group_id]) itemsByGroup[item.size_group_id] = [];
      if (size) itemsByGroup[item.size_group_id].push(size);
    }

    setGroups(groupsData.map((g) => ({
      ...g,
      sizes: itemsByGroup[g.id] || [],
    })));
  }, [supabase]);

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

  // ── Size Group CRUD ──

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setAddingGroup(true);

    const maxSort = groups.reduce((max, g) => Math.max(max, g.sort_order), 0);
    const { error } = await supabase.from("size_groups").insert({
      name: newGroupName.trim().toUpperCase(),
      sort_order: maxSort + 1,
    });

    if (error) {
      toast.error("Failed to add group: " + error.message);
    } else {
      setNewGroupName("");
      toast.success("Group added");
      await loadGroups();
    }
    setAddingGroup(false);
  }

  async function handleRenameGroup(groupId: string) {
    if (!editGroupName.trim()) return;
    const { error } = await supabase
      .from("size_groups")
      .update({ name: editGroupName.trim().toUpperCase() })
      .eq("id", groupId);

    if (error) {
      toast.error("Failed to rename: " + error.message);
    } else {
      setEditingGroup(null);
      await loadGroups();
    }
  }

  async function handleDeleteGroup() {
    if (!deleteGroupTarget) return;
    setDeleteGroupLoading(true);

    // Deactivate prices using sizes in this group
    for (const size of deleteGroupTarget.sizes) {
      await supabase
        .from("price_list")
        .update({ is_active: false })
        .eq("size_id", size.id)
        .eq("is_active", true);
    }

    const { error } = await supabase.from("size_groups").delete().eq("id", deleteGroupTarget.id);

    if (error) {
      toast.error("Failed to delete group: " + error.message);
    } else {
      toast.success(`Group "${deleteGroupTarget.name}" deleted`);
      setDeleteGroupTarget(null);
      await loadGroups();
    }
    setDeleteGroupLoading(false);
  }

  // ── Size CRUD within groups ──

  async function handleAddSizeToGroup(groupId: string) {
    const label = sizeInputs[groupId]?.trim();
    if (!label) return;
    setAddingSizeTo(groupId);

    // Check if a size with this label already exists
    const { data: existing } = await supabase
      .from("sizes")
      .select("id")
      .eq("label", label)
      .limit(1)
      .maybeSingle();

    let sizeId: string;

    if (existing) {
      sizeId = existing.id;
    } else {
      // Create new size
      const sortVal = sizeSortInputs[groupId] ? parseFloat(sizeSortInputs[groupId]) : null;
      const { data: newSize, error: createErr } = await supabase
        .from("sizes")
        .insert({ label, numeric_value: sortVal })
        .select("id")
        .single();

      if (createErr) {
        toast.error("Failed to create size: " + createErr.message);
        setAddingSizeTo(null);
        return;
      }
      sizeId = newSize.id;
    }

    // Link to group
    const groupSortOrder = (groups.find((g) => g.id === groupId)?.sizes.length || 0) + 1;
    const { error: linkErr } = await supabase
      .from("size_group_items")
      .insert({ size_group_id: groupId, size_id: sizeId, sort_order: groupSortOrder });

    if (linkErr) {
      if (linkErr.code === "23505") {
        toast.error("Size already in this group");
      } else {
        toast.error("Failed to link size: " + linkErr.message);
      }
    } else {
      setSizeInputs((prev) => ({ ...prev, [groupId]: "" }));
      setSizeSortInputs((prev) => ({ ...prev, [groupId]: "" }));
      await loadGroups();
    }
    setAddingSizeTo(null);
  }

  async function handleRemoveSizeFromGroup(groupId: string, sizeId: string) {
    const { error } = await supabase
      .from("size_group_items")
      .delete()
      .eq("size_group_id", groupId)
      .eq("size_id", sizeId);

    if (error) {
      toast.error("Failed to remove size: " + error.message);
    } else {
      await loadGroups();
    }
  }

  async function handleDeleteSize() {
    if (!deleteSizeTarget) return;
    setDeleteSizeLoading(true);

    // Deactivate all prices using this size
    await supabase
      .from("price_list")
      .update({ is_active: false })
      .eq("size_id", deleteSizeTarget.size.id)
      .eq("is_active", true);

    const { error } = await supabase.from("sizes").delete().eq("id", deleteSizeTarget.size.id);

    if (error) {
      toast.error("Failed to delete size: " + error.message);
    } else {
      toast.success(`Size "${deleteSizeTarget.size.label}" deleted`);
      setDeleteSizeTarget(null);
      await loadGroups();
    }
    setDeleteSizeLoading(false);
  }

  async function openDeleteSizeDialog(size: Size) {
    setDeleteSizeTarget({ size, groupName: "" });
    const { count } = await supabase
      .from("price_list")
      .select("id", { count: "exact", head: true })
      .eq("size_id", size.id)
      .eq("is_active", true);
    setDeleteSizePriceCount(count || 0);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    loadGroups();
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

      {/* ── SIZE GROUPS ── */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            <Settings className="h-5 w-5 inline mr-2" />
            SIZE GROUPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddGroup} className="flex gap-2">
            <Input
              placeholder="NEW GROUP NAME (E.G. FULL SHIRT, SHOES)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={addingGroup || !newGroupName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {groups.length === 0 ? (
            <p className="text-center py-6 text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              NO GROUPS YET — CREATE ONE TO START
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                return (
                  <div key={group.id} className="rounded-[12px] border-2 border-black overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center justify-between bg-[#00592B] px-3 py-2.5">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-white shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white shrink-0" />
                        )}
                        {editingGroup === group.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); handleRenameGroup(group.id); }}
                            className="flex items-center gap-2 flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              autoFocus
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              onBlur={() => handleRenameGroup(group.id)}
                              className="bg-white/10 text-white font-bold [font-family:var(--font-oswald)] uppercase text-[15px] px-2 py-0.5 rounded-[4px] outline-none border border-white/30 flex-1"
                            />
                          </form>
                        ) : (
                          <span className="font-bold text-white [font-family:var(--font-oswald)] uppercase text-[15px]">
                            {group.name}
                          </span>
                        )}
                        <span className="text-[12px] text-white/60 [font-family:var(--font-oswald)] font-bold">
                          ({group.sizes.length})
                        </span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingGroup(group.id); setEditGroupName(group.name); }}
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteGroupTarget(group); }}
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 hover:text-[#E374C7] hover:bg-white/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Group body — sizes list */}
                    {isExpanded && (
                      <div className="bg-white p-3 space-y-2">
                        {/* Add size form */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="SIZE LABEL"
                            value={sizeInputs[group.id] || ""}
                            onChange={(e) => setSizeInputs((prev) => ({ ...prev, [group.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSizeToGroup(group.id); } }}
                            className="flex-1 h-10"
                          />
                          <Input
                            type="number"
                            placeholder="SORT"
                            value={sizeSortInputs[group.id] || ""}
                            onChange={(e) => setSizeSortInputs((prev) => ({ ...prev, [group.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSizeToGroup(group.id); } }}
                            className="w-20 h-10"
                          />
                          <Button
                            onClick={() => handleAddSizeToGroup(group.id)}
                            size="icon"
                            className="shrink-0 h-10 w-10"
                            disabled={addingSizeTo === group.id || !(sizeInputs[group.id] || "").trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Sizes list */}
                        {group.sizes.length === 0 ? (
                          <p className="text-center py-3 text-[13px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                            NO SIZES IN THIS GROUP
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {group.sizes.map((size) => (
                              <div
                                key={size.id}
                                className="flex items-center gap-1.5 rounded-[8px] border-2 border-[#00592B] bg-[#00592B]/5 px-2.5 py-1.5"
                              >
                                <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase text-[14px]">
                                  {size.label}
                                </span>
                                <button
                                  onClick={() => handleRemoveSizeFromGroup(group.id, size.id)}
                                  className="text-[#4D8A6B] hover:text-[#C42424] cursor-pointer ml-0.5"
                                  title="Remove from group"
                                >
                                  <span className="text-[12px] font-bold">×</span>
                                </button>
                                <button
                                  onClick={() => openDeleteSizeDialog(size)}
                                  className="text-[#4D8A6B] hover:text-[#C42424] cursor-pointer"
                                  title="Delete size completely"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── PAYMENT SETTINGS ── */}
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

      {/* ── TEAM ── */}
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

      {/* ── SHOP DETAILS ── */}
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

      {/* ── DELETE GROUP DIALOG ── */}
      <Dialog open={!!deleteGroupTarget} onOpenChange={(open) => { if (!open) setDeleteGroupTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE SIZE GROUP</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete group &quot;{deleteGroupTarget?.name}&quot;?
            </p>
            {deleteGroupTarget && deleteGroupTarget.sizes.length > 0 && (
              <div className="rounded-[12px] border-2 border-[#C42424] bg-red-50 p-3">
                <p className="text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase">
                  WARNING: This group contains {deleteGroupTarget.sizes.length} size{deleteGroupTarget.sizes.length !== 1 ? "s" : ""}.
                  All prices using these sizes will be deactivated.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => setDeleteGroupTarget(null)}>
                <span>CANCEL</span>
              </Button>
              <Button variant="danger" onClick={handleDeleteGroup} disabled={deleteGroupLoading}>
                <span>{deleteGroupLoading ? "DELETING..." : "DELETE"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETE SIZE DIALOG ── */}
      <Dialog open={!!deleteSizeTarget} onOpenChange={(open) => { if (!open) { setDeleteSizeTarget(null); setDeleteSizePriceCount(0); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DELETE SIZE</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase">
              Are you sure you want to delete size &quot;{deleteSizeTarget?.size.label}&quot;?
            </p>
            <p className="text-[12px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
              This will remove it from all groups it belongs to.
            </p>
            {deleteSizePriceCount > 0 && (
              <div className="rounded-[12px] border-2 border-[#C42424] bg-red-50 p-3">
                <p className="text-[14px] font-bold text-[#C42424] [font-family:var(--font-oswald)] uppercase">
                  WARNING: This size is used in {deleteSizePriceCount} price{deleteSizePriceCount !== 1 ? "s" : ""}.
                  Those prices will be deactivated.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="tertiary" onClick={() => { setDeleteSizeTarget(null); setDeleteSizePriceCount(0); }}>
                <span>CANCEL</span>
              </Button>
              <Button variant="danger" onClick={handleDeleteSize} disabled={deleteSizeLoading}>
                <span>{deleteSizeLoading ? "DELETING..." : "DELETE"}</span>
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
