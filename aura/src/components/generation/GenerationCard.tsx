"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Download, Link2, Loader2, RefreshCw, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";

interface Generation {
  id: string;
  status: string;
  outputUrls: string[];
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  isFavorite?: boolean;
  shareToken?: string | null;
  mediaType?: string;
  workflow: { name: string; slug?: string };
  userPrompt?: string;
  createdAt: Date;
}

interface GenerationCardProps {
  generation: Generation;
  onOpen?: (generation: Generation) => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; pulse: boolean }> = {
  PENDING: { color: "bg-[#606060]", label: "Pending", pulse: true },
  QUEUED: { color: "bg-[#f59e0b]", label: "Queued", pulse: true },
  PROCESSING: { color: "bg-[#7c5af5]", label: "Processing", pulse: true },
  COMPLETED: { color: "bg-[#10b981]", label: "Done", pulse: false },
  FAILED: { color: "bg-[#ef4444]", label: "Failed", pulse: false },
  CANCELLED: { color: "bg-[#3f3f3f]", label: "Cancelled", pulse: false },
};

export function GenerationCard({ generation, onOpen }: GenerationCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(generation.isFavorite ?? false);
  const [shareToken, setShareToken] = useState(generation.shareToken ?? null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const utils = trpc.useUtils();

  const isProcessing = ["PENDING", "QUEUED", "PROCESSING"].includes(generation.status);
  const isFailed = generation.status === "FAILED";
  const isComplete = generation.status === "COMPLETED";
  const imageUrl = generation.outputUrls[0];
  const statusCfg = STATUS_CONFIG[generation.status] ?? STATUS_CONFIG.CANCELLED;

  const favoriteMutation = trpc.generations.toggleFavorite.useMutation({
    onMutate: () => setIsFavorite((v) => !v),
    onError: () => {
      setIsFavorite((v) => !v);
      toast.error("Failed to update favorites");
    },
    onSuccess: ({ isFavorite: newVal }) => {
      setIsFavorite(newVal);
      void utils.generations.list.invalidate();
    },
  });

  const shareMutation = trpc.generations.createShareLink.useMutation({
    onSuccess: async ({ shareToken: token }) => {
      setShareToken(token);
      const url = `${window.location.origin}/share/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Share link copied!");
      } catch {
        toast.info(`Share link: /share/${token}`);
      }
    },
    onError: () => toast.error("Failed to create share link"),
  });

  const retryMutation = trpc.generations.retry.useMutation({
    onSuccess: () => {
      void utils.generations.list.invalidate();
      toast.success("Generation retrying…");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    favoriteMutation.mutate({ id: generation.id });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shareToken) {
      const url = `${window.location.origin}/share/${shareToken}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Share link copied!");
      } catch {
        toast.info(`Share link: /share/${shareToken}`);
      }
      return;
    }
    shareMutation.mutate({ id: generation.id });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const ext = generation.mediaType === "VIDEO" ? "mp4" : "webp";
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `aura-${generation.id.slice(-8)}.${ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    toast.info("Download started");
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryMutation.mutate({ id: generation.id });
  };

  const handleCardClick = () => {
    if (isComplete && onOpen) onOpen(generation);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      onClick={handleCardClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#141414] group ring-1 ring-transparent transition-all duration-200",
        isComplete && onOpen ? "cursor-pointer hover:ring-[#7c5af5]/50 hover:scale-[1.015]" : "hover:ring-[#2a2a2a]"
      )}
    >
      <div className="relative aspect-square">
        {/* Processing state */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f0f0f]">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-[#7c5af5]/20 animate-ping absolute inset-0" />
              <div className="h-12 w-12 rounded-full border-2 border-t-[#7c5af5] border-[#7c5af5]/20 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xs text-[#a0a0a0] font-medium">{statusCfg.label}…</p>
              <p className="text-[10px] text-[#606060] mt-0.5">{generation.workflow.name}</p>
            </div>
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f0f0f] px-4">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-xs text-red-400 font-medium">Generation failed</p>
              <p className="text-[10px] text-[#606060] mt-0.5 line-clamp-2">
                {generation.userPrompt || generation.workflow.name}
              </p>
            </div>
            <button
              onClick={handleRetry}
              disabled={retryMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] text-xs font-medium text-[#a0a0a0] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-50"
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry
            </button>
          </div>
        )}

        {/* Completed image */}
        {isComplete && imageUrl && (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0f0f0f] animate-pulse" />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl}
                alt={generation.userPrompt || generation.workflow.name}
                fill
                className="object-cover"
                onLoad={() => setIsLoaded(true)}
                sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            </motion.div>
          </>
        )}

        {/* Status dot */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div
            className={cn(
              "h-2 w-2 rounded-full ring-2 ring-black/50",
              statusCfg.color,
              statusCfg.pulse && "animate-pulse"
            )}
          />
        </div>

        {/* Favorite indicator */}
        {isFavorite && (
          <div className="absolute top-2 right-2 z-10">
            <Heart className="h-3.5 w-3.5 fill-pink-400 text-pink-400 drop-shadow" />
          </div>
        )}

        {/* Hover actions overlay — only when complete */}
        {isComplete && imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
              <div className="flex-1 mr-2">
                <p className="text-[11px] text-white/70 font-medium truncate">
                  {generation.workflow.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleFavorite}
                  disabled={favoriteMutation.isPending}
                  className="h-8 w-8 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors border border-white/10"
                  title={isFavorite ? "Remove favorite" : "Add to favorites"}
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isFavorite ? "fill-pink-400 text-pink-400" : "text-white"
                    )}
                  />
                </button>
                <button
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                  className="h-8 w-8 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors border border-white/10"
                  title={copied ? "Copied!" : "Copy share link"}
                >
                  {shareMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  ) : copied ? (
                    <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="h-8 w-8 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors border border-white/10"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
