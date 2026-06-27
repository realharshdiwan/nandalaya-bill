import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-[20px] border-4 border-black bg-white px-[20px] py-[16px] text-[18px] text-[#00592B] shadow-[4px_4px_0_0_#000] [font-family:var(--font-oswald)] placeholder:text-[#B8AC8A] placeholder:uppercase transition-all",
        "hover:shadow-[6px_6px_0_0_#000]",
        "focus:outline-none focus:border-[#0023D1] focus:shadow-[6px_6px_0_0_#000]",
        "disabled:cursor-not-allowed disabled:bg-[#E8E0CC] disabled:text-[#B8AC8A] disabled:shadow-none",
        className
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-[20px] border-4 border-black bg-white px-[20px] py-[16px] text-[18px] text-[#00592B] shadow-[4px_4px_0_0_#000] [font-family:var(--font-oswald)] placeholder:text-[#B8AC8A] placeholder:uppercase transition-all",
        "hover:shadow-[6px_6px_0_0_#000]",
        "focus:outline-none focus:border-[#0023D1] focus:shadow-[6px_6px_0_0_#000]",
        "disabled:cursor-not-allowed disabled:bg-[#E8E0CC] disabled:text-[#B8AC8A] disabled:shadow-none",
        className
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
