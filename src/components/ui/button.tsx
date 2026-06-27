import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none cursor-pointer [font-family:var(--font-oswald)] uppercase font-bold disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-white text-[#00592B] rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:ring-4 focus-visible:ring-[#0023D1] focus-visible:ring-offset-4 active:not-aria-[haspopup]:translate-y-0 active:not-aria-[haspopup]:translate-x-0 [&>span]:skew-x-[15deg]",
        secondary:
          "bg-[#0023D1] text-white rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:ring-4 focus-visible:ring-[#E374C7] focus-visible:ring-offset-4 [&>span]:skew-x-[15deg]",
        tertiary:
          "bg-transparent text-[#00592B] rounded-[20px] border-4 border-black shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:bg-[#E374C7] hover:text-black hover:shadow-[10px_10px_0_0_#000] focus-visible:ring-4 focus-visible:ring-[#0023D1] focus-visible:ring-offset-4 [&>span]:skew-x-[15deg]",
        success:
          "bg-[#00592B] text-white rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:ring-4 focus-visible:ring-[#00592B] focus-visible:ring-offset-4 [&>span]:skew-x-[15deg]",
        danger:
          "bg-[#C42424] text-white rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:ring-4 focus-visible:ring-[#C42424] focus-visible:ring-offset-4 [&>span]:skew-x-[15deg]",
        warning:
          "bg-[#E0A100] text-black rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] hover:shadow-[10px_10px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:ring-4 focus-visible:ring-[#E0A100] focus-visible:ring-offset-4 [&>span]:skew-x-[15deg]",
        ghost:
          "bg-transparent text-[#00592B] rounded-[20px] hover:underline focus-visible:ring-4 focus-visible:ring-[#0023D1] focus-visible:ring-offset-4",
        link: "text-[#00592B] underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-11 px-[33px] py-[11px] text-[25px]",
        xs: "h-7 px-[18px] py-[6px] text-[16px] rounded-[12px] shadow-[2px_2px_0_0_#000] [&>span]:skew-x-[15deg]",
        sm: "h-8 px-[22px] py-[8px] text-[18px] rounded-[16px] shadow-[4px_4px_0_0_#000] [&>span]:skew-x-[15deg]",
        lg: "h-12 px-[40px] py-[14px] text-[28px] shadow-[8px_8px_0_0_#000] [&>span]:skew-x-[15deg]",
        xl: "h-14 px-[48px] py-[18px] text-[32px] shadow-[10px_10px_0_0_#000] [&>span]:skew-x-[15deg]",
        icon: "size-11 rounded-[20px] shadow-[6px_6px_0_0_#000] skew-x-[-15deg] [&>span]:skew-x-[15deg]",
        "icon-xs": "size-7 rounded-[12px] shadow-[2px_2px_0_0_#000] [&>span]:skew-x-[15deg]",
        "icon-sm": "size-8 rounded-[16px] shadow-[4px_4px_0_0_#000] [&>span]:skew-x-[15deg]",
        "icon-lg": "size-12 rounded-[20px] shadow-[8px_8px_0_0_#000] [&>span]:skew-x-[15deg]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
