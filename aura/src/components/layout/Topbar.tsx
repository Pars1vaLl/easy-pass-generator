"use client";

import { Bell, Gem, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data: meData } = trpc.users.me.useQuery(undefined, {
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
  const credits = meData?.credits ?? (user as { credits?: number })?.credits ?? 0;
  const isLowCredits = credits <= 5;

  return (
    <header className="topbar-border fixed top-0 right-0 left-0 lg:left-60 z-30 h-16 bg-[#09090f]/80 backdrop-blur-xl flex items-center px-4 gap-4">
      {/* Mobile spacer for hamburger */}
      <div className="w-9 lg:hidden flex-shrink-0" />

      {/* Logo — mobile only */}
      <Link href="/explore" className="lg:hidden flex items-center gap-2 flex-shrink-0">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#7c5af5] to-[#6366f1] flex items-center justify-center shadow-glow-sm">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-display font-bold text-[#f0f0f0] text-base tracking-tight drop-shadow-[0_0_12px_rgba(124,90,245,0.5)]">
          AURA
        </span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        {/* Credits badge */}
        <Link
          href="/settings"
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200",
            isLowCredits
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              : "bg-[#7c5af5]/10 border-[#7c5af5]/25 text-[#c4b5fd] hover:bg-[#7c5af5]/20 hover:border-[#7c5af5]/40"
          )}
        >
          <Gem className={cn("h-3 w-3", isLowCredits ? "text-amber-400" : "text-[#a78bfa]")} />
          <span>{credits.toLocaleString()}</span>
          {isLowCredits && <span className="text-[10px] text-amber-500/70">low</span>}
        </Link>

        {/* Notifications */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#1a1a24] transition-colors border border-transparent hover:border-[#1e1e2e]">
          <Bell className="h-4 w-4 text-[#4b5563]" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-[#1a1a24] transition-colors group border border-transparent hover:border-[#1e1e2e]">
          <div className="p-[1.5px] rounded-full bg-gradient-to-br from-[#7c5af5]/60 to-[#22d3ee]/30">
            <Avatar className="h-6 w-6 rounded-full overflow-hidden block">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="h-6 w-6 rounded-full bg-[#7c5af5]/20 flex items-center justify-center text-[10px] font-bold text-[#c4b5fd]">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="hidden md:block text-sm text-[#9ca3af] group-hover:text-[#f0f0f0] transition-colors max-w-[100px] truncate">
            {user?.name ?? "User"}
          </span>
        </button>
      </div>
    </header>
  );
}
