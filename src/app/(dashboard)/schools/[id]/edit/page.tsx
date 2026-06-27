"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("schools").select("*").eq("id", id).single();
      if (data) {
        setName(data.name || "");
        setShortCode(data.short_code || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
      }
      setLoaded(true);
    }
    load();
  }, [supabase, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("schools")
      .update({
        name,
        short_code: shortCode || null,
        address: address || null,
        phone: phone || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update school: " + error.message);
      setLoading(false);
    } else {
      toast.success("School updated");
      router.push(`/schools/${id}`);
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-[#4D8A6B] rounded animate-pulse" />
        <div className="h-64 bg-[#4D8A6B] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/schools/${id}`}
        className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        BACK TO SCHOOL
      </Link>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>EDIT SCHOOL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                SCHOOL NAME
              </Label>
              <Input
                id="name"
                placeholder="E.G. DAV PUBLIC SCHOOL"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_code" className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                SHORT CODE (OPTIONAL)
              </Label>
              <Input
                id="short_code"
                placeholder="E.G. DAV"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                ADDRESS (OPTIONAL)
              </Label>
              <Input
                id="address"
                placeholder="SCHOOL ADDRESS"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[16px] font-bold uppercase [font-family:var(--font-oswald)]">
                PHONE (OPTIONAL)
              </Label>
              <Input
                id="phone"
                placeholder="PHONE NUMBER"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                <span>{loading ? "SAVING..." : "UPDATE SCHOOL"}</span>
              </Button>
              <Link href={`/schools/${id}`}>
                <Button variant="tertiary" type="button">
                  <span>CANCEL</span>
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
