import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { decryptWorkflowConfig } from "@/lib/crypto";
import { WorkflowCreator } from "@/components/workflow/WorkflowCreator";
import type { WorkflowConfig } from "@/../../workers/types";

interface PageProps {
  params: { workflowSlug: string };
}

export default async function WorkflowCreatePage({ params }: PageProps) {
  const workflow = await db.workflow.findUnique({
    where: { slug: params.workflowSlug, isActive: true },
  });

  if (!workflow) notFound();

  let userInputSchema: WorkflowConfig["userInputSchema"] = [];
  // Expose only prefix/suffix/template for the client preview — never expose system prompt or model secrets
  let promptTemplatePreview: { template?: string; prefix?: string; suffix?: string } | null = null;

  try {
    const config = decryptWorkflowConfig<WorkflowConfig>(workflow.modelConfig as string);
    userInputSchema = config.userInputSchema ?? [];
    const pt = config.promptTemplate;
    if ("template" in pt) {
      promptTemplatePreview = { template: pt.template };
    } else {
      promptTemplatePreview = { prefix: pt.prefix, suffix: pt.suffix };
    }
  } catch {
    const config = workflow.modelConfig as Partial<WorkflowConfig>;
    userInputSchema = (config.userInputSchema ?? []) as WorkflowConfig["userInputSchema"];
    const pt = config.promptTemplate;
    if (pt) {
      if ("template" in pt) {
        promptTemplatePreview = { template: pt.template };
      } else if ("prefix" in pt || "suffix" in pt) {
        promptTemplatePreview = { prefix: (pt as { prefix?: string }).prefix, suffix: (pt as { suffix?: string }).suffix };
      }
    }
  }

  return (
    <WorkflowCreator
      workflowId={workflow.id}
      workflowName={workflow.name}
      workflowSlug={workflow.slug}
      previewUrls={workflow.previewUrls}
      creditCost={workflow.creditCost}
      userInputSchema={userInputSchema}
      promptTemplatePreview={promptTemplatePreview}
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
