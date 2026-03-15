"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowGrid } from "@/components/workflow/WorkflowGrid";
import { WorkflowFilter } from "@/components/workflow/WorkflowFilter";
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
      {
        category: category as never,
        search: debouncedSearch || undefined,
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCategoryChange = useCallback((cat: string | undefined) => {
    setCategory(cat);
  }, []);

  const handleSearchChange = useCallback((s: string) => {
    setSearch(s);
  }, []);

  const allWorkflows = data?.pages.flatMap((p) => p.workflows) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
          Explore Styles
        </h1>
        <p className="text-[#a0a0a0] mt-1">
          Choose a style and bring your vision to life with AI
        </p>
      </div>

      {/* Filters */}
      <WorkflowFilter
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
      />

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-[#7c5af5] animate-spin" />
        </div>
      ) : allWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
          <Sparkles className="h-12 w-12 text-[#2a2a2a]" />
          <p className="text-[#a0a0a0]">No styles found</p>
          <p className="text-sm text-[#606060]">Try a different search or category</p>
        </div>
      ) : (
        <>
          <WorkflowGrid workflows={allWorkflows} />
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
