"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Star, Gem } from "lucide-react";
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
  /** When true the card fills a 2×2 bento slot */
  featured?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  PORTRAIT:         "Portrait",
  LANDSCAPE:        "Landscape",
  ABSTRACT:         "Abstract",
  CINEMATIC:        "Cinematic",
  ANIME:            "Anime",
  ARCHITECTURE:     "Architecture",
  PRODUCT:          "Product",
  FASHION:          "Fashion",
  VIDEO_CINEMATIC:  "Video",
  VIDEO_ANIME:      "Anime Video",
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
  featured,
}: WorkflowCardProps) {
  const [hovered, setHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVideo = category.startsWith("VIDEO_");

  useEffect(() => {
    if (hovered && previewUrls.length > 1) {
      intervalRef.current = setInterval(() => {
        setPreviewIndex((i) => (i + 1) % previewUrls.length);
      }, 1100);
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
        className={cn(
          "relative overflow-hidden rounded-2xl cursor-pointer",
          "transition-all duration-300",
          "group-hover:shadow-[0_16px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(124,90,245,0.2),0_0_40px_-8px_rgba(124,90,245,0.3)]",
          "group-hover:scale-[1.02]"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPreviewIndex(0);
        }}
      >
        {/* Image area */}
        <div className={cn("relative bg-[#111118]", featured ? "aspect-square" : "aspect-[3/4]")}>
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 40vw"
                  : "(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
              }
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a24] to-[#09090f] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-[#1e1e2e]" />
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Top left: video or category pill */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {isVideo && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <Play className="h-2.5 w-2.5 text-white fill-white" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Video</span>
              </div>
            )}
            {!isVideo && (
              <div className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
              </div>
            )}
          </div>

          {/* Top right: featured star */}
          {isFeatured && (
            <div className="absolute top-2.5 right-2.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7c5af5]/80 backdrop-blur-sm border border-[#7c5af5]/40">
                <Star className="h-2.5 w-2.5 text-white fill-white" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Top</span>
              </div>
            </div>
          )}

          {/* Preview progress dots */}
          {previewUrls.length > 1 && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {previewUrls.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[3px] rounded-full transition-all duration-300",
                    i === previewIndex && hovered ? "w-5 bg-white" : "w-1.5 bg-white/25"
                  )}
                />
              ))}
            </div>
          )}

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
              {featured && description && (
                <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
              <Gem className="h-2.5 w-2.5 text-[#a78bfa]" />
              <span className="text-[11px] text-[#c4b5fd] font-semibold">{creditCost}</span>
            </div>
          </div>

          {/* Hover CTA */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-3 bottom-14"
              >
                <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c5af5] to-[#6366f1] text-white text-sm font-bold text-center shadow-glow-md">
                  Use this style →
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
}
