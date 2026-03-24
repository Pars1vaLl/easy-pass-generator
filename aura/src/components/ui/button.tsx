import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#7c5af5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]",
  {
    variants: {
      variant: {
        default: "bg-[#7c5af5] text-white hover:bg-[#6b47e8]",
        destructive:
          "bg-red-600 text-white hover:bg-red-600/90",
        outline:
          "border border-[#2a2a2a] bg-transparent hover:bg-[#1a1a24] hover:text-[#f0f0f0] text-[#a0a0a0]",
        secondary:
          "bg-[#1a1a24] text-[#f0f0f0] hover:bg-[#222232]",
        ghost: "hover:bg-[#1a1a24] hover:text-[#f0f0f0] text-[#9ca3af]",
        link: "text-[#7c5af5] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
