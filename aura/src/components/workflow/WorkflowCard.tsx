"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkflowCardProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  coverImageUrl: string;
  previewUrls: string[];
  creditCost: number;
  isFeatured?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  PORTRAIT: "Portrait",
  LANDSCAPE: "Landscape",
  ABSTRACT: "Abstract",
  CINEMATIC: "Cinematic",
  ANIME: "Anime",
  ARCHITECTURE: "Architecture",
  PRODUCT: "Product",
  FASHION: "Fashion",
  VIDEO_CINEMATIC: "Video",
  VIDEO_ANIME: "Anime Video",
  VIDEO_COMMERCIAL: "Commercial",
  VIDEO_SHORT_FILM: "Short Film",
};

export function WorkflowCard({
  name,
  slug,
  category,
  coverImageUrl,
  previewUrls,
  creditCost,
  isFeatured,
}: WorkflowCardProps) {
  const [hovered, setHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const isVideo = category.startsWith("VIDEO_");

  // Auto-cycle preview images on hover
  useState(() => {
    if (!hovered || previewUrls.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((i) => (i + 1) % previewUrls.length);
    }, 1200);
    return () => clearInterval(interval);
  });

  const displayImage = hovered && previewUrls[previewIndex]
    ? previewUrls[previewIndex]
    : coverImageUrl;

  return (
    <Link href={`/create/${slug}`} className="block">
      <div
        className="relative overflow-hidden rounded-xl group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPreviewIndex(0); }}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#141414]">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#141414] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-[#2a2a2a]" />
            </div>
          )}

          {/* Video indicator */}
          {isVideo && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                <Play className="h-3 w-3 text-white fill-white" />
                <span className="text-xs text-white font-medium">Video</span>
              </div>
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge className="text-xs">Featured</Badge>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
            >
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                <p className="text-white font-semibold text-sm leading-tight">{name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[category] ?? category}
                  </Badge>
                  <span className="text-xs text-[#c4b5fd] font-medium">
                    {creditCost} credit{creditCost !== 1 ? "s" : ""}
                  </span>
                </div>
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-full py-2 rounded-lg bg-[#7c5af5] text-white text-xs font-semibold text-center"
                >
                  ✨ Use this style
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview dots */}
        {hovered && previewUrls.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {previewUrls.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === previewIndex ? "w-4 bg-white" : "w-1 bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Below-card info (non-hover) */}
      <div className="mt-2 px-0.5 group-hover:hidden">
        <p className="text-sm font-medium text-[#f0f0f0] truncate">{name}</p>
        <p className="text-xs text-[#606060]">
          {CATEGORY_LABELS[category] ?? category}
        </p>
      </div>
    </Link>
  );
}
