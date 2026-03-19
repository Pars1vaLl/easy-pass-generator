"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Download, Heart, Link2, CheckCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface LightboxProps {
  generation: {
    id: string;
    outputUrls: string[];
    mediaType?: string;
    userPrompt?: string;
    isFavorite?: boolean;
    shareToken?: string | null;
    workflow: { name: string };
    createdAt: Date;
  } | null;
  onClose: () => void;
}

export function Lightbox({ generation, onClose }: LightboxProps) {
  const toast = useToast();
  const utils = trpc.useUtils();
  const [isFavorite, setIsFavorite] = useState(generation?.isFavorite ?? false);
  const [shareToken, setShareToken] = useState(generation?.shareToken ?? null);
  const [copied, setCopied] = useState(false);

  // Sync state when generation changes
  useEffect(() => {
    setIsFavorite(generation?.isFavorite ?? false);
    setShareToken(generation?.shareToken ?? null);
    setCopied(false);
  }, [generation?.id, generation?.isFavorite, generation?.shareToken]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (generation) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [generation]);

  const favoriteMutation = trpc.generations.toggleFavorite.useMutation({
    onMutate: () => setIsFavorite((v) => !v),
    onError: () => setIsFavorite((v) => !v),
    onSuccess: () => void utils.generations.list.invalidate(),
  });

  const shareMutation = trpc.generations.createShareLink.useMutation({
    onSuccess: async ({ shareToken: token }) => {
      setShareToken(token);
      await copyShareLink(token);
    },
    onError: () => toast.error("Failed to create share link"),
  });

  const copyShareLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Share link: /share/${token}`);
    }
  };

  const handleShare = () => {
    if (!generation) return;
    if (shareToken) { void copyShareLink(shareToken); return; }
    shareMutation.mutate({ id: generation.id });
  };

  const handleDownload = () => {
    if (!generation?.outputUrls[0]) return;
    const ext = generation.mediaType === "VIDEO" ? "mp4" : "webp";
    const a = document.createElement("a");
    a.href = generation.outputUrls[0];
    a.download = `aura-${generation.id.slice(-8)}.${ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    toast.info("Download started");
  };

  const imageUrl = generation?.outputUrls[0];
  const isVideo = generation?.mediaType === "VIDEO";

  return (
    <AnimatePresence>
      {generation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex flex-col lg:flex-row gap-0 max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden bg-[#141414] border border-[#2a2a2a] shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 h-8 w-8 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white/70 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image / Video */}
            <div className="flex-1 relative min-h-[300px] lg:min-h-[500px] bg-[#0a0a0a] flex items-center justify-center">
              {imageUrl && (
                isVideo ? (
                  <video
                    src={imageUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="max-h-[90vh] w-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={imageUrl}
                      alt={generation.userPrompt || generation.workflow.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      priority
                    />
                  </div>
                )
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-72 flex flex-col border-t lg:border-t-0 lg:border-l border-[#2a2a2a] p-5 space-y-5">
              {/* Workflow name */}
              <div>
                <p className="text-[10px] text-[#404040] uppercase tracking-widest font-semibold mb-1">Style</p>
                <p className="text-sm font-semibold text-[#f0f0f0]">{generation.workflow.name}</p>
              </div>

              {/* Prompt */}
              {generation.userPrompt && (
                <div>
                  <p className="text-[10px] text-[#404040] uppercase tracking-widest font-semibold mb-1">Prompt</p>
                  <p className="text-sm text-[#a0a0a0] leading-relaxed line-clamp-6">{generation.userPrompt}</p>
                </div>
              )}

              {/* Date */}
              <div>
                <p className="text-[10px] text-[#404040] uppercase tracking-widest font-semibold mb-1">Created</p>
                <p className="text-sm text-[#606060]">
                  {new Date(generation.createdAt).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </p>
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => favoriteMutation.mutate({ id: generation.id })}
                  disabled={favoriteMutation.isPending}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all",
                    isFavorite
                      ? "bg-pink-500/15 border-pink-500/40 text-pink-400"
                      : "bg-[#1c1c1c] border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:border-[#3a3a3a]"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-pink-400")} />
                  {isFavorite ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-xs font-medium text-[#a0a0a0] hover:text-white hover:border-[#3a3a3a] transition-all"
                >
                  {shareMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : copied ? (
                    <CheckCheck className="h-4 w-4 text-green-400" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Share"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-xs font-medium text-[#a0a0a0] hover:text-white hover:border-[#3a3a3a] transition-all"
                >
                  <Download className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
