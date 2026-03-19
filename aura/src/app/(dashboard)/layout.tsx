import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role;
  const credits = (session.user as { credits?: number }).credits ?? 0;

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-[#09090f]">
        <Sidebar userRole={userRole} credits={credits} />
        <Topbar />
        {/* Desktop: offset for sidebar. Mobile: full width. */}
        <main className="lg:pl-60 pt-16 min-h-screen">
          <div className="p-4 sm:p-6 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
