"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#C42424]">
          <span className="text-[24px] font-bold text-white [font-family:var(--font-oswald)]">!</span>
        </div>
        <h2 className="text-[24px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
          SOMETHING WENT WRONG
        </h2>
        <p className="text-[14px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase max-w-md">
          Failed to load settings. Check your connection and try again.
        </p>
        <Button onClick={reset}>
          <span>TRY AGAIN</span>
        </Button>
      </div>
    </div>
  );
}
