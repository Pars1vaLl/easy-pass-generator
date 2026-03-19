import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CreditBadgeProps {
  credits: number;
  className?: string;
}

export function CreditBadge({ credits, className }: CreditBadgeProps) {
  const isLow = credits <= 5;

  return (
    <Link
      href="/settings"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
        isLow
          ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fcd34d] hover:bg-[#f59e0b]/20"
          : "bg-[#7c5af5]/10 border-[#7c5af5]/30 text-[#c4b5fd] hover:bg-[#7c5af5]/20",
        className
      )}
    >
      <Gem className="h-3.5 w-3.5" />
      <span>{credits} credits</span>
    </Link>
  );
}
