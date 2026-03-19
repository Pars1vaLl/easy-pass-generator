import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#606060] resize-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5af5] focus-visible:border-[#7c5af5] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
