import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function createTestUser() {
  const hashedPassword = await bcrypt.hash("test123", 10);

  const user = await db.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: hashedPassword,
      name: "Test User",
      credits: 100,
      plan: "PRO",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("Test user created:");
  console.log("  Email: test@example.com");
  console.log("  Password: test123");
  console.log("  Credits:", user.credits);
  console.log("  Plan:", user.plan);
  console.log("  Role:", user.role);
}

createTestUser()
  .catch(console.error)
  .finally(() => db.$disconnect());
