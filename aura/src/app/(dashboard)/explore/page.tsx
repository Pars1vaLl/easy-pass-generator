"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowGrid } from "@/components/workflow/WorkflowGrid";
import { WorkflowFilter } from "@/components/workflow/WorkflowFilter";
import { WorkflowCardSkeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Loader2, Sparkles } from "lucide-react";

export default function ExplorePage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.workflows.list.useInfiniteQuery(
      { category: category as never, search: debouncedSearch || undefined, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 5 * 60 * 1000, // workflows rarely change
      }
    );

  // Infinite scroll
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
          Explore Styles
        </h1>
        <p className="text-[#606060] mt-0.5 text-sm">
          Pick a style and bring your vision to life in two clicks
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
          <Sparkles className="h-12 w-12 text-[#2a2a2a]" />
          <p className="text-[#a0a0a0] font-medium">No styles found</p>
          <p className="text-sm text-[#606060]">Try a different search or category</p>
        </div>
      ) : (
        <>
          {/* Featured section — shown only when not actively filtering */}
          {!isFiltering && featured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7c5af5]" />
                <h2 className="text-sm font-semibold text-[#f0f0f0] uppercase tracking-widest">
                  Featured
                </h2>
              </div>
              <WorkflowGrid workflows={featured} />
            </section>
          )}

          {/* All workflows (excluding featured when in sections mode) */}
          {(!isFiltering && rest.length > 0) ? (
            <section className="space-y-3">
              {featured.length > 0 && (
                <h2 className="text-sm font-semibold text-[#606060] uppercase tracking-widest">
                  All Styles
                </h2>
              )}
              <WorkflowGrid workflows={rest} />
            </section>
          ) : isFiltering ? (
            <WorkflowGrid workflows={allWorkflows} />
          ) : null}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 text-[#7c5af5] animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
