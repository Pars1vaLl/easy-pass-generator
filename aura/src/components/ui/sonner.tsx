"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#111118] group-[.toaster]:text-[#f0f0f0] group-[.toaster]:border-[#1e1e2e] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#606060]",
          actionButton:
            "group-[.toast]:bg-[#7c5af5] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#2a2a2a] group-[.toast]:text-[#a0a0a0]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
