import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import DeleteSchoolButton from "./delete-school-button";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (!school) notFound();

  const { data: priceList } = await supabase
    .from("price_list")
    .select("id, price, products(id, name, category), sizes(id, label, numeric_value)")
    .eq("school_id", id)
    .eq("is_active", true)
    .order("products(name)");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedPrices = (priceList || []).map((pl: any) => ({
    ...pl,
    products: Array.isArray(pl.products) ? pl.products[0] : pl.products,
    sizes: Array.isArray(pl.sizes) ? pl.sizes[0] : pl.sizes,
  }));

  const productMap: Record<string, { name: string; category: string; sizes: { label: string; price: number; priceId: string }[] }> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalizedPrices.forEach((pl: any) => {
    const productName = pl.products?.name || "Unknown";
    if (!productMap[productName]) {
      productMap[productName] = {
        name: productName,
        category: pl.products?.category || "",
        sizes: [],
      };
    }
    productMap[productName].sizes.push({
      label: pl.sizes?.label || "",
      price: pl.price,
      priceId: pl.id,
    });
  });

  const products = Object.values(productMap);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/schools"
            className="inline-flex items-center text-[14px] text-[#B3D6BF] hover:text-white [font-family:var(--font-oswald)] uppercase font-bold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            SCHOOLS
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
              {school.name}
            </h1>
            {school.short_code && (
              <Badge>{school.short_code}</Badge>
            )}
          </div>
          {(school.address || school.phone) && (
            <div className="flex items-center gap-4 text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
              {school.address && <span>{school.address}</span>}
              {school.phone && <span>{school.phone}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/schools/${id}/edit`}>
            <Button variant="tertiary">
              <Pencil className="mr-2 h-4 w-4" />
              <span>EDIT</span>
            </Button>
          </Link>
          <DeleteSchoolButton schoolId={id} schoolName={school.name} />
          <Link href={`/prices?school_id=${id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span>ADD PRICE</span>
            </Button>
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[18px]">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <div
                      key={size.label}
                      className="flex items-center gap-2 rounded-[12px] border-2 border-black px-3 py-2"
                    >
                      <span className="text-[14px] text-[#4D8A6B] [font-family:var(--font-oswald)] uppercase font-bold">
                        {size.label}
                      </span>
                      <span className="font-bold text-[#00592B] [font-family:var(--font-oswald)] text-[16px]">
                        ₹{size.price}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
            NO PRICES ADDED FOR THIS SCHOOL YET
          </p>
          <Link href={`/prices?school_id=${id}`}>
            <Button variant="tertiary" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              <span>ADD PRICES</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
