"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass,
  Plus,
  Image,
  FolderOpen,
  Settings,
  Shield,
  Zap,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { CreditBadge } from "@/components/shared/CreditBadge";

const navItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/gallery", label: "Gallery", icon: Image },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  userRole?: string;
  credits?: number;
}

export function Sidebar({ userRole, credits = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-16 lg:w-56 border-r border-[#2a2a2a] bg-[#0a0a0a] flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-3 lg:px-4 border-b border-[#2a2a2a]">
        <Link href="/explore" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="hidden lg:block font-display font-bold text-[#f0f0f0] text-lg tracking-tight">
            AURA
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "text-[#f0f0f0] bg-[#1c1c1c]"
                  : "text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#141414]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5af5] rounded-r"
                />
              )}
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}

        {userRole === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2.5 text-sm font-medium transition-all mt-4",
              pathname.startsWith("/admin")
                ? "text-[#f0f0f0] bg-[#1c1c1c]"
                : "text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#141414]"
            )}
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom: Credits + Logout */}
      <div className="p-2 lg:p-3 border-t border-[#2a2a2a] space-y-2">
        <div className="hidden lg:block">
          <CreditBadge credits={credits} />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-2 lg:px-3 py-2.5 text-sm font-medium text-[#606060] hover:text-[#f0f0f0] hover:bg-[#141414] transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
