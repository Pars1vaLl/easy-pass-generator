"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSession } from "next-auth/react";
import { CreditBadge } from "@/components/shared/CreditBadge";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const credits = (user as { credits?: number })?.credits ?? 0;

  return (
    <header className="fixed top-0 right-0 left-16 lg:left-56 z-30 h-16 border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md flex items-center px-4 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
          <input
            type="search"
            placeholder="Search styles, workflows..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#141414] border border-[#2a2a2a] text-sm text-[#f0f0f0] placeholder:text-[#606060] focus:outline-none focus:ring-1 focus:ring-[#7c5af5] focus:border-[#7c5af5] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Credits */}
        <div className="hidden sm:block">
          <CreditBadge credits={credits} />
        </div>

        {/* Notifications */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#1c1c1c] transition-colors">
          <Bell className="h-4 w-4 text-[#a0a0a0]" />
        </button>

        {/* Avatar */}
        <Avatar className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
          <AvatarImage
            src={user?.image ?? undefined}
            alt={user?.name ?? "User"}
            className="h-full w-full object-cover"
          />
          <AvatarFallback className="h-8 w-8 rounded-full bg-[#7c5af5]/20 flex items-center justify-center text-sm font-medium text-[#c4b5fd]">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
