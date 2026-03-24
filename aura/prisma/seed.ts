import { PrismaClient, WorkflowCategory } from "@prisma/client";

const db = new PrismaClient();

const sampleWorkflows = [
  {
    name: "Portrait Studio",
    slug: "portrait-studio",
    description: "Create stunning AI portraits with professional lighting",
    category: WorkflowCategory.PORTRAIT,
    coverImageUrl: "https://picsum.photos/seed/portrait/400/600",
    previewUrls: JSON.stringify(["https://picsum.photos/seed/p1/400/600", "https://picsum.photos/seed/p2/400/600"]),
    tags: JSON.stringify(["portrait", "professional", "studio"]),
    samplePrompts: JSON.stringify(["Professional headshot of a person", "Portrait with soft lighting"]),
    creditCost: 2,
    isActive: true,
    isFeatured: true,
    modelConfig: JSON.stringify({
      model: { primary: "openai", fallback: null },
      parameters: { width: 1024, height: 1024 },
    }),
    promptTemplate: JSON.stringify({
      template: "Professional portrait: {{prompt}}, high quality, detailed",
      variables: ["prompt"],
    }),
  },
  {
    name: "Landscape Art",
    slug: "landscape-art",
    description: "Generate beautiful landscape artwork",
    category: WorkflowCategory.LANDSCAPE,
    coverImageUrl: "https://picsum.photos/seed/landscape/800/400",
    previewUrls: JSON.stringify(["https://picsum.photos/seed/l1/800/400", "https://picsum.photos/seed/l2/800/400"]),
    tags: JSON.stringify(["landscape", "nature", "scenery"]),
    samplePrompts: JSON.stringify(["Mountain landscape at sunset", "Serene lake reflection"]),
    creditCost: 1,
    isActive: true,
    isFeatured: false,
    modelConfig: JSON.stringify({
      model: { primary: "openai", fallback: null },
      parameters: { width: 1792, height: 1024 },
    }),
    promptTemplate: JSON.stringify({
      template: "Beautiful landscape: {{prompt}}, scenic view, high resolution",
      variables: ["prompt"],
    }),
  },
  {
    name: "Anime Character",
    slug: "anime-character",
    description: "Create anime-style characters",
    category: WorkflowCategory.ANIME,
    coverImageUrl: "https://picsum.photos/seed/anime/600/800",
    previewUrls: JSON.stringify(["https://picsum.photos/seed/a1/600/800"]),
    tags: JSON.stringify(["anime", "character", "illustration"]),
    samplePrompts: JSON.stringify(["Anime girl with blue hair", "Cool anime protagonist"]),
    creditCost: 2,
    isActive: true,
    isFeatured: true,
    modelConfig: JSON.stringify({
      model: { primary: "openai", fallback: null },
      parameters: { width: 1024, height: 1024 },
    }),
    promptTemplate: JSON.stringify({
      template: "Anime style character: {{prompt}}, detailed anime art",
      variables: ["prompt"],
    }),
  },
  {
    name: "Cinematic Scene",
    slug: "cinematic-scene",
    description: "Generate cinematic movie-like scenes",
    category: WorkflowCategory.CINEMATIC,
    coverImageUrl: "https://picsum.photos/seed/cinema/800/450",
    previewUrls: JSON.stringify(["https://picsum.photos/seed/c1/800/450"]),
    tags: JSON.stringify(["cinematic", "movie", "dramatic"]),
    samplePrompts: JSON.stringify(["Epic battle scene", "Romantic sunset scene"]),
    creditCost: 3,
    isActive: true,
    isFeatured: false,
    modelConfig: JSON.stringify({
      model: { primary: "openai", fallback: null },
      parameters: { width: 1920, height: 1080 },
    }),
    promptTemplate: JSON.stringify({
      template: "Cinematic scene: {{prompt}}, movie quality, dramatic lighting",
      variables: ["prompt"],
    }),
  },
  {
    name: "Abstract Art",
    slug: "abstract-art",
    description: "Create unique abstract artwork",
    category: WorkflowCategory.ABSTRACT,
    coverImageUrl: "https://picsum.photos/seed/abstract/800/800",
    previewUrls: JSON.stringify(["https://picsum.photos/seed/ab1/800/800"]),
    tags: JSON.stringify(["abstract", "art", "creative"]),
    samplePrompts: JSON.stringify(["Colorful abstract shapes", "Geometric patterns"]),
    creditCost: 1,
    isActive: true,
    isFeatured: false,
    modelConfig: JSON.stringify({
      model: { primary: "openai", fallback: null },
      parameters: { width: 1024, height: 1024 },
    }),
    promptTemplate: JSON.stringify({
      template: "Abstract art: {{prompt}}, vibrant colors, artistic",
      variables: ["prompt"],
    }),
  },
];

async function seed() {
  console.log("Seeding database...");

  for (const workflow of sampleWorkflows) {
    await db.workflow.upsert({
      where: { slug: workflow.slug },
      update: workflow,
      create: workflow,
    });
  }

  console.log(`Created ${sampleWorkflows.length} workflows`);
  console.log("Seeding completed!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
