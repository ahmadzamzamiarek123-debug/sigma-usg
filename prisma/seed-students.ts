/**
 * Bulk Student Seeder Script
 *
 * Usage: npx tsx prisma/seed-students.ts
 *
 * This script imports students from prisma/students.json
 * - Hashes passwords with bcrypt (matching login logic)
 * - Skips existing NIMs (no duplicates)
 * - Logs progress to terminal
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Default password for all new students
const DEFAULT_PASSWORD = "maba2025";

interface StudentData {
  nim: string;
  name: string;
  prodi: string;
  angkatan: string;
}

async function main() {
  console.log("\n🎓 SIGMA - Bulk Student Seeder");
  console.log("================================\n");

  // Read students from JSON file
  const jsonPath = path.join(__dirname, "students.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ Error: students.json not found!");
    console.log("   Create prisma/students.json with your student data.");
    console.log(
      '   Format: [{ "nim": "12345678", "name": "Student Name", "prodi": "PRODI", "angkatan": "2025" }]'
    );
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const students: StudentData[] = JSON.parse(rawData);

  console.log(`📋 Found ${students.length} students in students.json`);
  console.log(`🔐 Default password: ${DEFAULT_PASSWORD}\n`);

  // Hash the default password once (reuse for all students)
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log("🔒 Password hashed with bcrypt (12 rounds)\n");

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const student of students) {
    try {
      // Check if NIM already exists
      const existing = await prisma.user.findUnique({
        where: { identifier: student.nim },
      });

      if (existing) {
        console.log(
          `⏭️  Skipped: ${student.nim} (${student.name}) - already exists`
        );
        skipped++;
        continue;
      }

      // Insert new student
      await prisma.user.create({
        data: {
          identifier: student.nim,
          name: student.name,
          passwordHash: passwordHash,
          role: "USER",
          prodi: student.prodi,
          angkatan: student.angkatan,
          isActive: true,
          mustChangePassword: false, // Set to true if you want to force password change
        },
      });

      // Create initial balance (0)
      const newUser = await prisma.user.findUnique({
        where: { identifier: student.nim },
      });

      if (newUser) {
        await prisma.balance.create({
          data: {
            userId: newUser.id,
            balance: 0,
          },
        });
      }

      console.log(
        `✅ Success: ${student.nim} - ${student.name} (${student.prodi})`
      );
      inserted++;
    } catch (error) {
      console.error(`❌ Error: ${student.nim} - ${(error as Error).message}`);
      errors++;
    }
  }

  console.log("\n================================");
  console.log("📊 Summary:");
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log("================================\n");

  if (inserted > 0) {
    console.log(`🎉 Done! ${inserted} new students can now login with:`);
    console.log(`   NIM: [their NIM]`);
    console.log(`   Password: ${DEFAULT_PASSWORD}\n`);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
