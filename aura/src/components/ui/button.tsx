import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5af5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#7c5af5] text-white hover:bg-[#6b47e8] shadow-lg shadow-[rgba(124,90,245,0.25)]",
        secondary:
          "bg-[#1c1c1c] text-[#f0f0f0] hover:bg-[#2a2a2a] border border-[#2a2a2a]",
        ghost: "hover:bg-[#1c1c1c] text-[#a0a0a0] hover:text-[#f0f0f0]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-[#2a2a2a] bg-transparent hover:bg-[#1c1c1c] text-[#f0f0f0]",
        link: "text-[#7c5af5] underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-hero text-white font-semibold shadow-lg shadow-[rgba(124,90,245,0.3)] hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
