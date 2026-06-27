import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[20px] border-4 border-black px-3 py-1 text-[14px] font-bold uppercase [font-family:var(--font-oswald)] transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[#00592B] text-white border-black",
        secondary:
          "bg-white text-[#00592B] border-black",
        destructive:
          "bg-[#C42424] text-white border-black",
        outline:
          "bg-transparent text-[#00592B] border-black",
        success:
          "bg-[#00592B] text-white border-black",
        warning:
          "bg-[#E0A100] text-black border-black",
        danger:
          "bg-[#C42424] text-white border-black",
        tertiary:
          "bg-[#0023D1] text-white border-black",
        quaternary:
          "bg-[#E374C7] text-black border-black",
        dark:
          "bg-black text-white border-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
