"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Download, MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Generation {
  id: string;
  status: string;
  outputUrls: string[];
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  workflow: { name: string };
  createdAt: Date;
}

interface GenerationCardProps {
  generation: Generation;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[#606060]",
  QUEUED: "bg-[#f59e0b]",
  PROCESSING: "bg-[#f59e0b]",
  COMPLETED: "bg-[#10b981]",
  FAILED: "bg-[#ef4444]",
  CANCELLED: "bg-[#606060]",
};

export function GenerationCard({ generation }: GenerationCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isProcessing = ["PENDING", "QUEUED", "PROCESSING"].includes(generation.status);
  const isFailed = generation.status === "FAILED";
  const isComplete = generation.status === "COMPLETED";
  const imageUrl = generation.outputUrls[0];

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#141414] group">
      <div className="relative aspect-square">
        {/* Placeholder / loading state */}
        {!isComplete || !imageUrl ? (
          <div className="absolute inset-0 bg-[#141414] flex flex-col items-center justify-center gap-3">
            {isProcessing && (
              <>
                <div className="generation-spinner" />
                <span className="text-xs text-[#606060] capitalize">
                  {generation.status.toLowerCase()}...
                </span>
              </>
            )}
            {isFailed && (
              <div className="text-center px-4">
                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-red-400 text-sm">✕</span>
                </div>
                <span className="text-xs text-[#606060]">Generation failed</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Blurhash placeholder */}
            {generation.blurhash && !isLoaded && (
              <div
                className="absolute inset-0 bg-[#1c1c1c]"
                style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
              />
            )}

            {/* Real image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                onLoad={() => setIsLoaded(true)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </motion.div>
          </>
        )}

        {/* Status indicator */}
        <div className="absolute top-2 left-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            STATUS_COLORS[generation.status] ?? "bg-[#606060]",
            isProcessing && "animate-pulse"
          )} />
        </div>

        {/* Hover overlay */}
        {isComplete && imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 p-3 w-full flex items-end justify-between">
              <span className="text-xs text-white/80 truncate flex-1 mr-2">
                {generation.workflow.name}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="h-7 w-7 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Heart className="h-3.5 w-3.5 text-white" />
                </button>
                <button
                  onClick={() => window.open(imageUrl, "_blank")}
                  className="h-7 w-7 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-white" />
                </button>
                <button className="h-7 w-7 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                  <MoreHorizontal className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
