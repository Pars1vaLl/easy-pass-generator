import { db } from "@/lib/db";
import { signUrl } from "@/lib/storage";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const generation = await db.generation.findFirst({
    where: { shareToken: params.token, status: "COMPLETED" },
    include: { workflow: { select: { name: true } } },
  });

  if (!generation) return { title: "Not Found" };

  return {
    title: `${generation.workflow.name} — AURA`,
    description: `AI-generated image created with AURA using the ${generation.workflow.name} style.`,
  };
}

export default async function SharePage({ params }: Props) {
  const generation = await db.generation.findFirst({
    where: { shareToken: params.token, status: "COMPLETED" },
    include: {
      workflow: { select: { name: true, category: true } },
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  if (!generation) notFound();

  const signedUrls = await Promise.all(
    generation.outputUrls.map((url) => signUrl(url, 86400).catch(() => url))
  );

  const firstUrl = signedUrls[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[#606060] uppercase tracking-widest">AURA</p>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">{generation.workflow.name}</h1>
          {generation.user.name && (
            <p className="text-sm text-[#a0a0a0]">by {generation.user.name}</p>
          )}
        </div>

        {/* Image */}
        {firstUrl && (
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#141414]">
            <Image
              src={firstUrl}
              alt={generation.workflow.name}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        )}

        {/* Prompt */}
        {generation.userPrompt && (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <p className="text-xs text-[#606060] uppercase tracking-widest mb-2">Prompt</p>
            <p className="text-[#c0c0c0] text-sm leading-relaxed">{generation.userPrompt}</p>
          </div>
        )}

        {/* Download */}
        {firstUrl && (
          <a
            href={firstUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#7c5af5] hover:bg-[#6b4be0] text-white text-sm font-medium transition-colors"
          >
            Download Image
          </a>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#404040]">
          Created with{" "}
          <a href="/" className="text-[#7c5af5] hover:underline">
            AURA
          </a>
        </p>
      </div>
    </div>
  );
}
