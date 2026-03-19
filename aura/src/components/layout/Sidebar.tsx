"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Plus,
  Image,
  FolderOpen,
  Settings,
  Shield,
  Zap,
  LogOut,
  Menu,
  X,
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
      <div className="flex h-16 items-center px-4 border-b border-[#1e1e1e] flex-shrink-0">
        <Link href="/explore" className="flex items-center gap-2.5" onClick={onLinkClick}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#7c5af5] to-[#5a3fd4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#7c5af5]/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-[#f0f0f0] text-lg tracking-tight">
            AURA
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
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
                  ? "text-white bg-[#7c5af5]/15 shadow-sm"
                  : "text-[#808080] hover:text-[#f0f0f0] hover:bg-[#141414]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#7c5af5] rounded-r-full"
                />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                  isActive ? "text-[#9b7fff]" : "text-current"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}

        {userRole === "ADMIN" && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] text-[#404040] uppercase tracking-widest font-semibold">Admin</p>
            </div>
            <Link
              href="/admin"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "text-white bg-[#7c5af5]/15"
                  : "text-[#808080] hover:text-[#f0f0f0] hover:bg-[#141414]"
              )}
            >
              <Shield className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1e1e1e] space-y-2 flex-shrink-0">
        <CreditBadge credits={credits ?? 0} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#606060] hover:text-[#f0f0f0] hover:bg-[#141414] transition-all"
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
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-full w-60 border-r border-[#1e1e1e] bg-[#0a0a0a] flex-col">
        <NavContent pathname={pathname} userRole={userRole} credits={credits} />
      </aside>

      {/* Mobile: hamburger button in topbar area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 flex items-center justify-center rounded-xl bg-[#141414] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1e1e1e] transition-all"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="lg:hidden fixed left-0 top-0 z-50 h-full w-72 bg-[#0a0a0a] border-r border-[#1e1e1e] flex flex-col shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#1e1e1e] text-[#606060] hover:text-white transition-all"
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
