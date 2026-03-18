"use client";

import { Bell, ChevronDown, Gem } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const credits = (user as { credits?: number })?.credits ?? 0;
  const isLowCredits = credits <= 5;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 z-30 h-16 border-b border-[#1e1e1e] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center px-4 gap-4">
      {/* Left spacer for mobile hamburger */}
      <div className="w-9 lg:hidden flex-shrink-0" />

      {/* AURA logo (mobile only) */}
      <Link href="/explore" className="lg:hidden flex items-center gap-2 flex-shrink-0">
        <span className="font-display font-bold text-[#f0f0f0] text-base tracking-tight">AURA</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Credits */}
        <Link
          href="/settings"
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
            isLowCredits
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
              : "bg-[#141414] border-[#2a2a2a] text-[#c4b5fd] hover:bg-[#1c1c1c]"
          )}
        >
          <Gem className="h-3.5 w-3.5" />
          <span>{credits.toLocaleString()}</span>
        </Link>

        {/* Notifications */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#141414] transition-colors border border-transparent hover:border-[#2a2a2a]">
          <Bell className="h-4 w-4 text-[#606060]" />
        </button>

        {/* Avatar + name */}
        <button className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-[#141414] transition-colors group border border-transparent hover:border-[#2a2a2a]">
          <Avatar className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "User"}
              className="h-full w-full object-cover"
            />
            <AvatarFallback className="h-7 w-7 rounded-full bg-[#7c5af5]/20 flex items-center justify-center text-xs font-semibold text-[#c4b5fd]">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm text-[#a0a0a0] group-hover:text-[#f0f0f0] transition-colors max-w-[120px] truncate">
            {user?.name ?? "User"}
          </span>
          <ChevronDown className="hidden md:block h-3.5 w-3.5 text-[#606060]" />
        </button>
      </div>
    </header>
  );
}
