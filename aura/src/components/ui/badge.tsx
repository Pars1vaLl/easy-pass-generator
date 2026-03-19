import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#7c5af5]/20 text-[#c4b5fd] border border-[#7c5af5]/30",
        secondary: "bg-[#1c1c1c] text-[#a0a0a0] border border-[#2a2a2a]",
        success: "bg-[#10b981]/20 text-[#6ee7b7] border border-[#10b981]/30",
        warning: "bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/30",
        destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
        outline: "border border-[#2a2a2a] text-[#a0a0a0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
