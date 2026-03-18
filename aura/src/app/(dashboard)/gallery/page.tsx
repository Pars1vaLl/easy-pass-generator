"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { GenerationGrid } from "@/components/generation/GenerationGrid";
import { GenerationCardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Plus, Heart, Film, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GenerationStatus, MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { label: string; value: GenerationStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Completed", value: "COMPLETED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Failed", value: "FAILED" },
];

export default function GalleryPage() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<GenerationStatus | undefined>(undefined);
  const [mediaType, setMediaType] = useState<MediaType | undefined>(undefined);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    trpc.generations.list.useInfiniteQuery(
      { limit: 24, status, mediaType, favoritesOnly },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: (query) => {
          // Poll every 3s if any generation is still in progress
          const hasActive = query.state.data?.pages
            .flatMap((p) => p.generations)
            .some((g) =>
              ["PENDING", "QUEUED", "PROCESSING"].includes(g.status)
            );
          return hasActive ? 3000 : false;
        },
      }
    );

  const { data: stats, isLoading: statsLoading } = trpc.generations.stats.useQuery(
    undefined,
    { staleTime: 10_000 }
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

  // SSE for real-time updates
  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as { event?: string };
        if (data.event === "generation.completed" || data.event === "generation.failed") {
          void refetch();
        }
      } catch {}
    };
    return () => es.close();
  }, [refetch]);

  const allGenerations = data?.pages.flatMap((p) => p.generations) ?? [];
  const hasProcessing = allGenerations.some((g) =>
    ["PENDING", "QUEUED", "PROCESSING"].includes(g.status)
  );

  const handleStatusChange = useCallback((v: GenerationStatus | undefined) => setStatus(v), []);
  const handleMediaTypeChange = useCallback((v: MediaType | undefined) => setMediaType(v), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
            My Gallery
          </h1>
          <p className="text-[#606060] mt-0.5 text-sm">
            Your AI-generated creations
          </p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link href="/explore">
            <Plus className="h-4 w-4 mr-1.5" />
            Create
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Sparkles, color: "text-[#7c5af5]" },
            { label: "Completed", value: stats.completed, icon: ImageIcon, color: "text-[#10b981]" },
            { label: "Favorites", value: stats.favorites, icon: Heart, color: "text-pink-400" },
            { label: "Success rate", value: `${stats.successRate}%`, icon: TrendingUp, color: "text-[#f59e0b]" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] p-4 flex items-center gap-3"
            >
              <div className={cn("flex-shrink-0", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#f0f0f0] leading-none">{s.value}</p>
                <p className="text-[11px] text-[#606060] mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Processing banner */}
      {hasProcessing && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#7c5af5]/10 border border-[#7c5af5]/25">
          <Loader2 className="h-4 w-4 text-[#7c5af5] animate-spin flex-shrink-0" />
          <p className="text-sm text-[#c4b5fd]">
            Generation in progress — your results will appear automatically
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <div className="flex gap-1 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e] p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleStatusChange(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                status === opt.value
                  ? "bg-[#7c5af5] text-white shadow-sm"
                  : "text-[#606060] hover:text-[#f0f0f0]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Media type */}
        <div className="flex gap-1 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e] p-1">
          {[
            { value: undefined, label: "All" },
            { value: "IMAGE" as MediaType, label: "Images", icon: ImageIcon },
            { value: "VIDEO" as MediaType, label: "Videos", icon: Film },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleMediaTypeChange(opt.value)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                mediaType === opt.value
                  ? "bg-[#7c5af5] text-white shadow-sm"
                  : "text-[#606060] hover:text-[#f0f0f0]"
              )}
            >
              {opt.icon && <opt.icon className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Favorites */}
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
            favoritesOnly
              ? "bg-pink-500/15 border-pink-500/40 text-pink-400"
              : "bg-[#0d0d0d] border-[#1e1e1e] text-[#606060] hover:text-[#f0f0f0]"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", favoritesOnly && "fill-pink-400")} />
          Favorites
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <GenerationCardSkeleton key={i} />
          ))}
        </div>
      ) : allGenerations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#f0f0f0] font-semibold">
              {favoritesOnly ? "No favorites yet" : "No creations yet"}
            </p>
            <p className="text-sm text-[#606060] mt-1">
              {favoritesOnly
                ? "Heart any generation to see it here"
                : "Pick a style and generate your first image"}
            </p>
          </div>
          {!favoritesOnly && (
            <Button asChild>
              <Link href="/explore">
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Styles
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <GenerationGrid generations={allGenerations} />
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 text-[#7c5af5] animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
