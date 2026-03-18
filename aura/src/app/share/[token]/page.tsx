import { db } from "@/lib/db";
import { signUrl } from "@/lib/storage";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Download, Zap, ArrowRight } from "lucide-react";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Validate token format early to avoid unnecessary DB hits
  if (!/^[0-9a-f]{40}$/i.test(params.token)) return { title: "Not Found" };

  const generation = await db.generation.findFirst({
    where: { shareToken: params.token, status: "COMPLETED" },
    select: { workflow: { select: { name: true } } },
  });

  if (!generation) return { title: "Not Found — AURA" };

  return {
    title: `${generation.workflow.name} — AURA`,
    description: `AI-generated image made with the ${generation.workflow.name} style on AURA.`,
    openGraph: { title: `${generation.workflow.name} — AURA`, type: "article" },
  };
}

export default async function SharePage({ params }: Props) {
  if (!/^[0-9a-f]{40}$/i.test(params.token)) notFound();

  const generation = await db.generation.findFirst({
    where: { shareToken: params.token, status: "COMPLETED" },
    select: {
      id: true,
      outputUrls: true,
      mediaType: true,
      userPrompt: true,
      // Never select resolvedPrompt, metadata, jobId, params — those are internal
      workflow: { select: { name: true, category: true } },
      user: { select: { name: true } },
      createdAt: true,
    },
  });

  if (!generation) notFound();

  // Use 4-hour TTL for share pages (cached in Redis via signUrl)
  const signedUrls = await Promise.all(
    generation.outputUrls.map((url) => signUrl(url, 14400).catch(() => url))
  );

  const firstUrl = signedUrls[0];
  const isVideo = generation.mediaType === "VIDEO";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-1.5 group mb-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[#7c5af5] to-[#5a3fd4] flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-[#f0f0f0]">AURA</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">
            {generation.workflow.name}
          </h1>
          {generation.user.name && (
            <p className="text-sm text-[#606060]">by {generation.user.name}</p>
          )}
        </div>

        {/* Media */}
        {firstUrl && (
          <div className="relative rounded-2xl overflow-hidden bg-[#141414] shadow-2xl shadow-black/50 ring-1 ring-white/5">
            {isVideo ? (
              <video
                src={firstUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="relative aspect-square">
                <Image
                  src={firstUrl}
                  alt={generation.workflow.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                  priority
                />
              </div>
            )}
          </div>
        )}

        {/* Prompt */}
        {generation.userPrompt && (
          <div className="rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] px-4 py-3">
            <p className="text-[10px] text-[#404040] uppercase tracking-widest mb-1.5 font-semibold">Prompt</p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">{generation.userPrompt}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {firstUrl && (
            <a
              href={firstUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#141414] hover:bg-[#1c1c1c] border border-[#2a2a2a] text-[#f0f0f0] text-sm font-medium transition-all"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#7c5af5] hover:bg-[#6b47e8] text-white text-sm font-bold transition-all shadow-lg shadow-[#7c5af5]/30"
          >
            Try AURA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-[#303030]">
          Generated with AURA AI
        </p>
      </div>
    </div>
  );
}
