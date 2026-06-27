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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#00592B] text-[20px] font-bold text-white [font-family:var(--font-oswald)]">
          N
        </div>
        <CardTitle className="text-[28px]">Nandalaya</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-[16px] font-bold uppercase">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="YOU@EXAMPLE.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="password" className="text-[16px] font-bold uppercase">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-[14px] text-[#C42424] [font-family:var(--font-oswald)] uppercase font-bold">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            <span>{loading ? "SIGNING IN..." : "SIGN IN"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
