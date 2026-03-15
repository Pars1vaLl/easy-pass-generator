"use client";

import { GenerationCard } from "./GenerationCard";

interface Generation {
  id: string;
  status: string;
  outputUrls: string[];
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  workflow: { name: string };
  createdAt: Date;
}

interface GenerationGridProps {
  generations: Generation[];
}

export function GenerationGrid({ generations }: GenerationGridProps) {
  return (
    <div className="masonry-grid">
      {generations.map((g) => (
        <div key={g.id} className="masonry-item">
          <GenerationCard generation={g} />
        </div>
      ))}
    </div>
  );
}
