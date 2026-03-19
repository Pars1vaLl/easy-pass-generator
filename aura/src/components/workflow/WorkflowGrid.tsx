"use client";

import { WorkflowCard } from "./WorkflowCard";

interface Workflow {
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

interface WorkflowGridProps {
  workflows: Workflow[];
  /** If true, renders the first card as a 2×2 bento hero slot */
  bento?: boolean;
}

export function WorkflowGrid({ workflows, bento }: WorkflowGridProps) {
  if (workflows.length === 0) return null;

  if (bento && workflows.length >= 2) {
    const [hero, ...rest] = workflows;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr">
        {/* Hero card — 2×2 bento slot */}
        <div className="col-span-2 row-span-2">
          <div className="h-full">
            <WorkflowCard {...hero!} featured />
          </div>
        </div>
        {rest.map((w) => (
          <WorkflowCard key={w.id} {...w} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {workflows.map((w) => (
        <WorkflowCard key={w.id} {...w} />
      ))}
    </div>
  );
}
