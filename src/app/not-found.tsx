import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[20px] bg-white shadow-[6px_6px_0_0_#000]">
          <span className="text-[40px] font-bold text-[#00592B] [font-family:var(--font-oswald)]">404</span>
        </div>
        <h2 className="text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
          PAGE NOT FOUND
        </h2>
        <p className="text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase max-w-md">
          This page does not exist or has been moved.
        </p>
        <Link href="/">
          <Button>
            <span>GO HOME</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
