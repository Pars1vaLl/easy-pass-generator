"use client";

import { useRef, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { GenerationGrid } from "@/components/generation/GenerationGrid";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Plus, Heart, Film } from "lucide-react";
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.generations.list.useInfiniteQuery(
      { limit: 24, status, mediaType, favoritesOnly },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const { data: stats } = trpc.generations.stats.useQuery();

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

  const allGenerations = data?.pages.flatMap((p) => p.generations) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
            My Gallery
          </h1>
          <p className="text-[#a0a0a0] mt-1">Your AI-generated creations</p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Completed", value: stats.completed },
            { label: "Favorites", value: stats.favorites },
            { label: "Success Rate", value: `${stats.successRate}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 text-center">
              <p className="text-2xl font-bold text-[#f0f0f0]">{s.value}</p>
              <p className="text-xs text-[#606060] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status filters */}
        <div className="flex gap-1 rounded-lg bg-[#141414] border border-[#2a2a2a] p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                status === opt.value
                  ? "bg-[#7c5af5] text-white"
                  : "text-[#a0a0a0] hover:text-[#f0f0f0]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Media type filter */}
        <div className="flex gap-1 rounded-lg bg-[#141414] border border-[#2a2a2a] p-1">
          <button
            onClick={() => setMediaType(undefined)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              !mediaType ? "bg-[#7c5af5] text-white" : "text-[#a0a0a0] hover:text-[#f0f0f0]"
            )}
          >
            All
          </button>
          <button
            onClick={() => setMediaType("IMAGE")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
              mediaType === "IMAGE" ? "bg-[#7c5af5] text-white" : "text-[#a0a0a0] hover:text-[#f0f0f0]"
            )}
          >
            <ImageIcon className="h-3 w-3" /> Images
          </button>
          <button
            onClick={() => setMediaType("VIDEO")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
              mediaType === "VIDEO" ? "bg-[#7c5af5] text-white" : "text-[#a0a0a0] hover:text-[#f0f0f0]"
            )}
          >
            <Film className="h-3 w-3" /> Videos
          </button>
        </div>

        {/* Favorites toggle */}
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
            favoritesOnly
              ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
              : "bg-[#141414] border-[#2a2a2a] text-[#a0a0a0] hover:text-[#f0f0f0]"
          )}
        >
          <Heart className={cn("h-3 w-3", favoritesOnly && "fill-pink-400")} />
          Favorites
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-[#7c5af5] animate-spin" />
        </div>
      ) : allGenerations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[#141414] flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[#2a2a2a]" />
          </div>
          <div>
            <p className="text-[#f0f0f0] font-medium">
              {favoritesOnly ? "No favorites yet" : "No creations yet"}
            </p>
            <p className="text-sm text-[#606060] mt-1">
              {favoritesOnly ? "Heart a generation to save it here" : "Choose a style and start creating"}
            </p>
          </div>
          {!favoritesOnly && (
            <Button asChild>
              <Link href="/explore">
                <Plus className="h-4 w-4 mr-2" />
                Explore Styles
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <GenerationGrid generations={allGenerations} />
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
