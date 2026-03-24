import { db } from "@/lib/db";
import { Users, Image, LayoutGrid, Activity, TrendingUp } from "lucide-react";
import { AreaChartComponent, BarChartComponent, PieChartComponent } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Get generation stats by status
  const generationsByStatus = await db.generation.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  // Get users by plan
  const usersByPlan = await db.user.groupBy({
    by: ["plan"],
    _count: { plan: true },
  });

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { label: "Generations", value: generationCount, icon: Image, color: "text-purple-400", bgColor: "bg-purple-500/10" },
    { label: "Active Workflows", value: workflowCount, icon: LayoutGrid, color: "text-green-400", bgColor: "bg-green-500/10" },
    { label: "Generations Today", value: recentGenerations, icon: Activity, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  ];

  // Sample data for charts (in production, fetch from DB)
  const generationTrendData = [
    { month: "Jan", desktop: 186, mobile: 80 },
    { month: "Feb", desktop: 305, mobile: 120 },
    { month: "Mar", desktop: 237, mobile: 100 },
    { month: "Apr", desktop: 273, mobile: 140 },
    { month: "May", desktop: 309, mobile: 160 },
    { month: "Jun", desktop: 374, mobile: 190 },
  ];

  const generationTrendConfig = {
    desktop: { label: "Desktop", color: "#7c5af5" },
    mobile: { label: "Mobile", color: "#6366f1" },
  };

  const userGrowthData = [
    { month: "Jan", users: 120 },
    { month: "Feb", users: 180 },
    { month: "Mar", users: 250 },
    { month: "Apr", users: 320 },
    { month: "May", users: 410 },
    { month: "Jun", users: 520 },
  ];

  const userGrowthConfig = {
    users: { label: "Users", color: "#a78bfa" },
  };

  const planDistributionData = usersByPlan.map((item) => ({
    name: item.plan,
    value: item._count.plan,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">
        Admin Overview
      </h1>

      {/* Stats Cards - shadcn/ui Card style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bgColor }) => (
          <Card key={label} className="bg-[#111118] border-[#1e1e2e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#f0f0f0]">
                    {value.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#606060]">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Trend - Area Chart */}
        <AreaChartComponent
          title="Generation Trend"
          description="Desktop vs Mobile generations over time"
          data={generationTrendData}
          config={generationTrendConfig}
          dataKey="desktop"
          nameKey="month"
          trend={{ value: "12.5%", direction: "up" }}
          footer="Last 6 months data"
        />

        {/* User Growth - Bar Chart */}
        <BarChartComponent
          title="User Growth"
          description="New user registrations per month"
          data={userGrowthData}
          config={userGrowthConfig}
          nameKey="month"
          trend={{ value: "8.2%", direction: "up" }}
          footer="Steady growth observed"
        />

        {/* Plan Distribution - Pie Chart */}
        {planDistributionData.length > 0 && (
          <PieChartComponent
            title="Users by Plan"
            description="Distribution of users across different plans"
            data={planDistributionData}
          />
        )}

        {/* Generation Status - Line Chart */}
        <LineChartComponent
          title="Activity Overview"
          description="System activity trends"
          data={generationTrendData}
          config={generationTrendConfig}
          nameKey="month"
          footer="Real-time updates enabled"
        />
      </div>

      {/* Recent Activity Summary */}
      <Card className="bg-[#111118] border-[#1e1e2e]">
        <CardHeader>
          <CardTitle className="text-[#f0f0f0] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#7c5af5]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generationsByStatus.map((item) => (
              <div
                key={item.status}
                className="flex flex-col items-center p-4 rounded-lg bg-[#141414] border border-[#1e1e2e]"
              >
                <span className="text-2xl font-bold text-[#f0f0f0]">
                  {item._count.status}
                </span>
                <span className="text-xs text-[#606060] capitalize">
                  {item.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
