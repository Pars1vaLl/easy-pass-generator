import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { decryptWorkflowConfig } from "@/lib/crypto";
import { WorkflowCreator } from "@/components/workflow/WorkflowCreator";

interface PageProps {
  params: { workflowSlug: string };
}

export default async function WorkflowCreatePage({ params }: PageProps) {
  const workflow = await db.workflow.findUnique({
    where: { slug: params.workflowSlug, isActive: true },
  });

  if (!workflow) notFound();

  let userInputSchema: unknown[] = [];
  try {
    const config = decryptWorkflowConfig<{ userInputSchema?: unknown[] }>(
      workflow.modelConfig as string
    );
    userInputSchema = config.userInputSchema ?? [];
  } catch {
    const config = workflow.modelConfig as { userInputSchema?: unknown[] };
    userInputSchema = config.userInputSchema ?? [];
  }

  return (
    <WorkflowCreator
      workflowId={workflow.id}
      workflowName={workflow.name}
      workflowSlug={workflow.slug}
      previewUrls={workflow.previewUrls}
      creditCost={workflow.creditCost}
      userInputSchema={userInputSchema as never}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const workflow = await db.workflow.findUnique({
    where: { slug: params.workflowSlug },
    select: { name: true, description: true },
  });

  return {
    title: workflow ? `${workflow.name} — AURA` : "Create — AURA",
    description: workflow?.description,
  };
}
