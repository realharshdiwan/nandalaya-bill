"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      variant="tertiary"
    >
      <Printer className="mr-2 h-4 w-4" />
      <span>PRINT</span>
    </Button>
  );
}
