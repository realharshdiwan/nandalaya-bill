"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewSchoolPage() {
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("schools").insert({
      name,
      short_code: shortCode || null,
      address: address || null,
      phone: phone || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/schools");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/schools"
        className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        BACK TO SCHOOLS
      </Link>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>ADD SCHOOL</CardTitle>
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
            {error && (
              <p className="text-[14px] text-[#C42424] [font-family:var(--font-oswald)] uppercase font-bold">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                <span>{loading ? "SAVING..." : "SAVE SCHOOL"}</span>
              </Button>
              <Link href="/schools">
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
