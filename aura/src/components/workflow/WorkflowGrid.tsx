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
}

export function WorkflowGrid({ workflows }: WorkflowGridProps) {
  return (
    <div className="masonry-grid">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="masonry-item">
          <WorkflowCard {...workflow} />
        </div>
      ))}
    </div>
  );
}
