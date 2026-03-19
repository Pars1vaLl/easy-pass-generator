"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowGrid } from "@/components/workflow/WorkflowGrid";
import { WorkflowFilter } from "@/components/workflow/WorkflowFilter";
import { WorkflowCardSkeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Loader2, Sparkles, Zap } from "lucide-react";

export default function ExplorePage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.workflows.list.useInfiniteQuery(
      { category: category as never, search: debouncedSearch || undefined, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 5 * 60 * 1000,
      }
    );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCategoryChange = useCallback((cat: string | undefined) => setCategory(cat), []);
  const handleSearchChange = useCallback((s: string) => setSearch(s), []);

  const allWorkflows = data?.pages.flatMap((p) => p.workflows) ?? [];
  const featured = allWorkflows.filter((w) => w.isFeatured);
  const rest = allWorkflows.filter((w) => !w.isFeatured);
  const isFiltering = Boolean(debouncedSearch || category);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
            Explore Styles
          </h1>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7c5af5]/15 border border-[#7c5af5]/25">
            <Zap className="h-3 w-3 text-[#a78bfa]" />
            <span className="text-[10px] font-semibold text-[#a78bfa] uppercase tracking-wider">AI</span>
          </div>
        </div>
        <p className="text-[#4b5563] text-sm">
          Pick a style — generate in two clicks
        </p>
      </div>

      {/* Filters */}
      <WorkflowFilter
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <WorkflowCardSkeleton key={i} />)}
        </div>
      ) : allWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#111118] border border-[#1e1e2e] flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-[#1e1e2e]" />
          </div>
          <p className="text-[#9ca3af] font-medium">No styles found</p>
          <p className="text-sm text-[#4b5563]">Try a different search or category</p>
        </div>
      ) : (
        <>
          {/* Featured section — bento grid, shown when not filtering */}
          {!isFiltering && featured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-[#7c5af5]/30 to-transparent" />
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#7c5af5]" />
                  <span className="text-xs font-bold text-[#7c5af5] uppercase tracking-widest">
                    Featured
                  </span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-[#7c5af5]/30 to-transparent" />
              </div>
              <WorkflowGrid workflows={featured} bento />
            </section>
          )}

          {/* All styles */}
          {(!isFiltering && rest.length > 0) ? (
            <section className="space-y-3">
              {featured.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-[#1e1e2e]" />
                  <span className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">
                    All Styles
                  </span>
                  <div className="h-px flex-1 bg-[#1e1e2e]" />
                </div>
              )}
              <WorkflowGrid workflows={rest} />
            </section>
          ) : isFiltering ? (
            <WorkflowGrid workflows={allWorkflows} />
          ) : null}

          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 text-[#7c5af5] animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
