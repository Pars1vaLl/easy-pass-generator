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
      <div className="min-h-screen bg-[#0a0a0a]">
        <Sidebar userRole={userRole} credits={credits} />
        <Topbar />
        <main className="pl-16 lg:pl-56 pt-16">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
