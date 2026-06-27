import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { School, Plus } from "lucide-react";

export default async function SchoolsPage() {
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, short_code, is_active")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)]">
            SCHOOLS
          </h1>
          <p className="mt-1 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            {schools?.length || 0} SCHOOLS
          </p>
        </div>
        <Link href="/schools/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            <span>ADD SCHOOL</span>
          </Button>
        </Link>
      </div>

      {schools && schools.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <Link key={school.id} href={`/schools/${school.id}`}>
              <Card className="cursor-pointer hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#00592B]">
                    <School className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#00592B] truncate [font-family:var(--font-oswald)] uppercase text-[16px]">
                      {school.name}
                    </p>
                    {school.short_code && (
                      <p className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                        {school.short_code}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <School className="mx-auto h-12 w-12 text-[#4D8A6B]" />
          <p className="mt-4 text-[16px] text-white [font-family:var(--font-oswald)] uppercase font-bold">
            NO SCHOOLS YET
          </p>
          <Link href="/schools/new">
            <Button variant="tertiary" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              <span>ADD YOUR FIRST SCHOOL</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
