"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Image,
  FolderOpen,
  Settings,
  Shield,
  Zap,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { CreditBadge } from "@/components/shared/CreditBadge";

const navItems = [
  { href: "/explore",     label: "Explore",     icon: Compass },
  { href: "/gallery",     label: "Gallery",     icon: Image },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/settings",    label: "Settings",    icon: Settings },
];

interface SidebarProps {
  userRole?: string;
  credits?: number;
}

function NavContent({
  pathname,
  userRole,
  credits,
  onLinkClick,
}: {
  pathname: string;
  userRole?: string;
  credits?: number;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 flex-shrink-0 border-b border-[#1e1e2e]/60">
        <Link href="/explore" className="flex items-center gap-2.5" onClick={onLinkClick}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#7c5af5] to-[#6366f1] flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-[#f0f0f0] text-lg tracking-tight drop-shadow-[0_0_16px_rgba(124,90,245,0.55)]">
            AURA
          </span>
        </Link>
      </div>

      {/* Create CTA */}
      <div className="px-3 pt-4 pb-1 flex-shrink-0">
        <Link
          href="/explore"
          onClick={onLinkClick}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c5af5] to-[#6366f1] text-white text-sm font-semibold shadow-glow-sm hover:shadow-glow-md transition-all duration-200 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          Create
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white bg-[#7c5af5]/10"
                  : "text-[#4b5563] hover:text-[#f0f0f0] hover:bg-[#1a1a24]"
              )}
            >
              {/* Left bar indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-gradient-to-b from-[#7c5af5] to-[#a78bfa] rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                  isActive ? "text-[#a78bfa]" : "text-current"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}

        {userRole === "ADMIN" && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] text-[#1e1e2e] uppercase tracking-widest font-bold">Admin</p>
            </div>
            <Link
              href="/admin"
              onClick={onLinkClick}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "text-white bg-[#7c5af5]/10"
                  : "text-[#4b5563] hover:text-[#f0f0f0] hover:bg-[#1a1a24]"
              )}
            >
              {pathname.startsWith("/admin") && (
                <motion.div
                  layoutId="nav-pill-admin"
                  className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-gradient-to-b from-[#7c5af5] to-[#a78bfa] rounded-r-full"
                />
              )}
              <Shield className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1e1e2e]/60 space-y-1.5 flex-shrink-0">
        <CreditBadge credits={credits ?? 0} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4b5563] hover:text-[#f0f0f0] hover:bg-[#1a1a24] transition-all"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar({ userRole, credits = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-full w-60 border-r border-[#1e1e2e]/60 bg-[#09090f]/95 backdrop-blur-xl flex-col">
        <NavContent pathname={pathname} userRole={userRole} credits={credits} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 flex items-center justify-center rounded-xl bg-[#111118] border border-[#1e1e2e] text-[#9ca3af] hover:text-white hover:bg-[#1a1a24] transition-all"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 42 }}
              className="lg:hidden fixed left-0 top-0 z-50 h-full w-72 bg-[#09090f]/97 backdrop-blur-xl border-r border-[#1e1e2e]/60 flex flex-col shadow-[4px_0_40px_rgba(0,0,0,0.6)]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a24] text-[#4b5563] hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <NavContent
                pathname={pathname}
                userRole={userRole}
                credits={credits}
                onLinkClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
