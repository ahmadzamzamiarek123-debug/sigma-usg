/**
 * Mass Balance Update Script (Airdrop)
 * * Usage: npx tsx prisma/seed-saldo.ts
 * * Logic:
 * - Finds all users with role 'USER'
 * - Adds (increments) specific balance to ALL of them at once
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GANTI JUMLAH SALDO DI SINI
const AMOUNT_TO_ADD = 100000; // Nambah 100rb ke semua user

async function main() {
  console.log("\n💰 SIGMA - Mass Top-up Script");
  console.log("================================");

  try {
    // 1. Cari dulu ID semua mahasiswa (Role: USER)
    // Kita tidak ingin memberi saldo ke Admin/Operator
    const students = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true },
    });

    const studentIds = students.map((s) => s.id);

    console.log(`📋 Found ${studentIds.length} students/users.`);
    console.log(
      `💸 Adding Rp ${AMOUNT_TO_ADD.toLocaleString("id-ID")} to everyone...`
    );

    // 2. Update saldo massal (Batch Update)
    const updateResult = await prisma.balance.updateMany({
      where: {
        userId: {
          in: studentIds, // Update saldo hanya untuk ID yang ada di list mahasiswa
        },
      },
      data: {
        balance: {
          increment: AMOUNT_TO_ADD, // Gunakan increment agar saldo lama tidak hilang
        },
      },
    });

    console.log(`\n✅ Success! Updated ${updateResult.count} balances.`);
    console.log("================================");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
