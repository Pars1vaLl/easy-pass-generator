import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5af5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#7c5af5] text-white hover:bg-[#6b47e8] shadow-glow-sm hover:shadow-glow-md",
        secondary:
          "bg-[#1a1a24] text-[#f0f0f0] hover:bg-[#222232] border border-[#1e1e2e]",
        ghost:
          "hover:bg-[#1a1a24] text-[#9ca3af] hover:text-[#f0f0f0]",
        destructive:
          "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
        outline:
          "border border-[#1e1e2e] bg-transparent hover:bg-[#1a1a24] hover:border-[#7c5af5]/40 text-[#f0f0f0]",
        link:
          "text-[#7c5af5] underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-hero text-white font-semibold shadow-glow-sm hover:shadow-glow-md hover:opacity-90",
        glow:
          "bg-[#7c5af5] text-white hover:bg-[#6b47e8] shadow-glow-md hover:shadow-glow-lg",
        "ghost-border":
          "border border-[#1e1e2e] bg-transparent text-[#9ca3af] hover:text-[#f0f0f0] hover:border-[#7c5af5]/50 hover:bg-[#7c5af5]/8",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-11 rounded-lg px-8 text-base",
        xl:      "h-12 rounded-xl px-8 text-base font-semibold",
        icon:    "h-10 w-10",
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
