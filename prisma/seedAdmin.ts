import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "Admin@123"; // change this
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email,
      fullName: "Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
      updatedAt: new Date(),
    },
  });

  console.log("Admin created:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
