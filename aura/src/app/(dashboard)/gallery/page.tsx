"use client";

import { useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { GenerationGrid } from "@/components/generation/GenerationGrid";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Plus } from "lucide-react";
import Link from "next/link";

export default function GalleryPage() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.generations.list.useInfiniteQuery(
      { limit: 24 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

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
            <p className="text-[#f0f0f0] font-medium">No creations yet</p>
            <p className="text-sm text-[#606060] mt-1">
              Choose a style and start creating
            </p>
          </div>
          <Button asChild>
            <Link href="/explore">
              <Plus className="h-4 w-4 mr-2" />
              Explore Styles
            </Link>
          </Button>
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
