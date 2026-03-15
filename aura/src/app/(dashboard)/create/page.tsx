"use client";

import { WorkflowGrid } from "@/components/workflow/WorkflowGrid";
import { WorkflowFilter } from "@/components/workflow/WorkflowFilter";
import { trpc } from "@/lib/trpc/client";
import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function CreatePage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = trpc.workflows.list.useInfiniteQuery(
    { category: category as never, search: debouncedSearch || undefined, limit: 40 },
    { getNextPageParam: (p) => p.nextCursor }
  );

  const workflows = data?.pages.flatMap((p) => p.workflows) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
          Choose a Style
        </h1>
        <p className="text-[#a0a0a0] mt-1">
          Pick a workflow and describe your vision
        </p>
      </div>

      <WorkflowFilter
        onCategoryChange={useCallback((c: string | undefined) => setCategory(c), [])}
        onSearchChange={useCallback((s: string) => setSearch(s), [])}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-[#7c5af5] animate-spin" />
        </div>
      ) : (
        <WorkflowGrid workflows={workflows} />
      )}
    </div>
  );
}
