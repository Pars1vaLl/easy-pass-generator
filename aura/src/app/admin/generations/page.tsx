"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  COMPLETED: "success",
  PROCESSING: "warning",
  QUEUED: "warning",
  PENDING: "outline",
  FAILED: "destructive",
  CANCELLED: "secondary",
};

export default function AdminGenerationsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: generations, isLoading } = trpc.generations.adminList.useQuery({
    limit: 50,
    status: statusFilter as never,
  });

  const statuses = ["PENDING", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">Generations</h1>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !statusFilter
              ? "bg-[#7c5af5] text-white"
              : "bg-[#141414] text-[#a0a0a0] border border-[#2a2a2a] hover:bg-[#1c1c1c]"
          }`}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-[#7c5af5] text-white"
                : "bg-[#141414] text-[#a0a0a0] border border-[#2a2a2a] hover:bg-[#1c1c1c]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 text-[#7c5af5] animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#141414] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Workflow</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Prompt</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {generations?.map((g) => (
                <tr key={g.id} className="hover:bg-[#141414]/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#a0a0a0] text-xs">{g.user?.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-[#a0a0a0]">{g.workflow?.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#f0f0f0] text-xs max-w-xs truncate">{g.userPrompt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[g.status] ?? "outline"}>
                      {g.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#606060] text-xs">
                    {new Date(g.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
