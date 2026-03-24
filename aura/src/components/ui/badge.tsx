import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#7c5af5]/20 text-[#c4b5fd] hover:bg-[#7c5af5]/30",
        secondary:
          "border-transparent bg-[#1c1c1c] text-[#a0a0a0] hover:bg-[#2a2a2a]",
        destructive:
          "border-transparent bg-red-500/20 text-red-300 hover:bg-red-500/30",
        outline: "text-[#a0a0a0] border-[#2a2a2a]",
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
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
