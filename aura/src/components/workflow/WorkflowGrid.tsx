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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} {...workflow} />
      ))}
    </div>
  );
}
