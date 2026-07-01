"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  role: "owner" | "staff";
  display_name: string | null;
}

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, role, display_name")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      } else {
        // Check if any owner already exists
        const { count: ownerCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "owner");

        // First user becomes owner; everyone else gets staff
        const role = ownerCount === 0 ? "owner" : "staff";

        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ id: user.id, role, display_name: user.email?.split("@")[0] || null })
          .select("id, role, display_name")
          .single();

        if (newProfile) setProfile(newProfile as Profile);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const isOwner = profile?.role === "owner";

  return { profile, isOwner, loading };
}
