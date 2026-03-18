"use client";

import { GenerationCard } from "./GenerationCard";

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

interface GenerationGridProps {
  generations: Generation[];
}

export function GenerationGrid({ generations }: GenerationGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {generations.map((g) => (
        <GenerationCard key={g.id} generation={g} />
      ))}
    </div>
  );
}
