"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Star } from "lucide-react";
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
  description,
  category,
  coverImageUrl,
  previewUrls,
  creditCost,
  isFeatured,
}: WorkflowCardProps) {
  const [hovered, setHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVideo = category.startsWith("VIDEO_");

  // Cycle preview images on hover
  useEffect(() => {
    if (hovered && previewUrls.length > 1) {
      intervalRef.current = setInterval(() => {
        setPreviewIndex((i) => (i + 1) % previewUrls.length);
      }, 1200);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hovered, previewUrls.length]);

  const displayImage =
    hovered && previewUrls[previewIndex] ? previewUrls[previewIndex] : coverImageUrl;

  return (
    <Link href={`/create/${slug}`} className="block group">
      <div
        className="relative overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-[#7c5af5]/20"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPreviewIndex(0);
        }}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#141414]">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-[#2a2a2a]" />
            </div>
          )}

          {/* Gradient base */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Video badge */}
          {isVideo && (
            <div className="absolute top-2.5 left-2.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
                <Play className="h-3 w-3 text-white fill-white" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Video</span>
              </div>
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && (
            <div className="absolute top-2.5 right-2.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7c5af5]/80 backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 text-white fill-white" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Featured</span>
              </div>
            </div>
          )}

          {/* Preview dots */}
          {previewUrls.length > 1 && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {previewUrls.slice(0, 4).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === previewIndex && hovered ? "w-5 bg-white" : "w-1.5 bg-white/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom info always visible */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm leading-tight">{name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-white/50">
              {CATEGORY_LABELS[category] ?? category}
            </span>
            <span className="text-[11px] text-[#c4b5fd] font-medium">
              {creditCost} cr.
            </span>
          </div>
        </div>

        {/* Hover CTA */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-3 bottom-3"
            >
              <div className="mt-16 w-full py-2 rounded-xl bg-[#7c5af5] text-white text-xs font-bold text-center shadow-lg shadow-[#7c5af5]/40">
                ✨ Use this style
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
