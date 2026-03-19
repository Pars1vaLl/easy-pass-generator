import { db } from "@/lib/db";
import { Users, Image, LayoutGrid, Activity } from "lucide-react";

export default async function AdminOverviewPage() {
  const [userCount, generationCount, workflowCount, recentGenerations] =
    await Promise.all([
      db.user.count(),
      db.generation.count(),
      db.workflow.count({ where: { isActive: true } }),
      db.generation.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-400" },
    { label: "Generations", value: generationCount, icon: Image, color: "text-purple-400" },
    { label: "Active Workflows", value: workflowCount, icon: LayoutGrid, color: "text-green-400" },
    { label: "Generations Today", value: recentGenerations, icon: Activity, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">
        Admin Overview
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-[#f0f0f0]">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-[#606060]">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
