import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#606060] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7c5af5] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
