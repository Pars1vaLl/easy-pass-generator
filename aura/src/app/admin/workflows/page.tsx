"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminWorkflowsPage() {
  const utils = trpc.useUtils();
  const { data: workflows, isLoading } = trpc.workflows.adminList.useQuery();

  const deleteMutation = trpc.workflows.adminDelete.useMutation({
    onSuccess: () => utils.workflows.adminList.invalidate(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">
          Workflows
        </h1>
        <Button asChild>
          <Link href="/admin/workflows/new">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Link>
        </Button>
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
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Category</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Credits</th>
                <th className="text-left px-4 py-3 text-[#a0a0a0] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[#a0a0a0] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {workflows?.map((w) => (
                <tr key={w.id} className="hover:bg-[#141414]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[#f0f0f0] font-medium">{w.name}</p>
                      <p className="text-[#606060] text-xs">{w.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{w.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[#a0a0a0]">{w.creditCost}</td>
                  <td className="px-4 py-3">
                    {w.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    {w.isFeatured && (
                      <Badge className="ml-1">Featured</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/workflows/${w.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm("Delete this workflow?")) {
                            deleteMutation.mutate({ id: w.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
