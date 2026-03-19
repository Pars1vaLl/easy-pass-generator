import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, LayoutGrid, Users, Activity, Shield } from "lucide-react";
import { SessionProvider } from "next-auth/react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: Activity },
  { href: "/admin/workflows", label: "Workflows", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/generations", label: "Generations", icon: Shield },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session?.user || role !== "ADMIN") {
    redirect("/explore");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-[#0a0a0a] flex">
        {/* Admin sidebar */}
        <aside className="w-56 border-r border-[#2a2a2a] fixed h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-[#2a2a2a] gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#f0f0f0] text-sm">AURA</span>
              <span className="text-xs text-[#7c5af5] block leading-none">Admin Panel</span>
            </div>
          </div>
          <nav className="p-2 space-y-1 flex-1">
            {adminNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#141414] transition-all"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-[#2a2a2a]">
            <Link
              href="/explore"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#606060] hover:text-[#f0f0f0] transition-colors"
            >
              ← Back to app
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="pl-56 flex-1 p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
