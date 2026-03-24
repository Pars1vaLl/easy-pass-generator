import { PrismaClient, WorkflowCategory } from "@prisma/client";

const db = new PrismaClient();

async function seedGptImageWorkflow() {
  console.log("Creating GPT Image workflow...");

  const workflow = await db.workflow.upsert({
    where: { slug: "gpt-image-studio" },
    update: {},
    create: {
      name: "GPT Image Studio",
      slug: "gpt-image-studio",
      description: "Generate high-quality images using OpenAI's GPT Image API with advanced capabilities",
      category: WorkflowCategory.PORTRAIT,
      coverImageUrl: "https://picsum.photos/seed/gpt-image/800/800",
      previewUrls: JSON.stringify([
        "https://picsum.photos/seed/gpt1/800/800",
        "https://picsum.photos/seed/gpt2/800/800",
      ]),
      tags: JSON.stringify(["gpt-image", "openai", "high-quality", "advanced"]),
      samplePrompts: JSON.stringify([
        "A serene Japanese garden with cherry blossoms",
        "Futuristic cityscape at sunset with flying cars",
        "Portrait of a wise old wizard with glowing eyes",
      ]),
      creditCost: 3,
      isActive: true,
      isFeatured: true,
      modelConfig: JSON.stringify({
        mediaType: "image",
        model: { primary: "gpt-image-1", fallback: null },
        parameters: {
          size: "auto",
          quality: "high",
          moderation: "auto",
          n: 1,
        },
        promptTemplate: {
          template: "{{userPrompt}}",
          system: "You are an expert image generation assistant. Create high-quality, detailed images.",
        },
        userInputSchema: [
          {
            name: "size",
            label: "Image Size",
            type: "select",
            required: false,
            placeholder: "Select image dimensions",
            options: [
              { label: "Auto (recommended)", value: "auto" },
              { label: "Square (1024x1024)", value: "1024x1024" },
              { label: "Portrait (1024x1536)", value: "1024x1536" },
              { label: "Landscape (1536x1024)", value: "1536x1024" },
            ],
            default: "auto",
          },
          {
            name: "quality",
            label: "Quality",
            type: "select",
            required: false,
            placeholder: "Select quality level",
            options: [
              { label: "Auto", value: "auto" },
              { label: "Low (faster)", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High (best)", value: "high" },
            ],
            default: "high",
          },
          {
            name: "background",
            label: "Background",
            type: "select",
            required: false,
            placeholder: "Background type",
            options: [
              { label: "Auto", value: "auto" },
              { label: "Transparent", value: "transparent" },
              { label: "Opaque", value: "opaque" },
            ],
            default: "auto",
          },
        ],
        samplePrompts: [
          "A serene Japanese garden with cherry blossoms",
          "Futuristic cityscape at sunset with flying cars",
          "Portrait of a wise old wizard with glowing eyes",
        ],
        creditCost: 3,
      }),
      promptTemplate: JSON.stringify({
        template: "{{userPrompt}}",
        system: "You are an expert image generation assistant.",
      }),
    },
  });

  console.log("GPT Image workflow created:");
  console.log("  Name:", workflow.name);
  console.log("  Slug:", workflow.slug);
  console.log("  Credits:", workflow.creditCost);
}

seedGptImageWorkflow()
  .catch(console.error)
  .finally(() => db.$disconnect());
