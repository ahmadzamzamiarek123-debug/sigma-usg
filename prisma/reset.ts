import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log(">> Resetting database (keep only Admin)...");

  // Delete in order of dependencies
  console.log("Deleting transactions...");
  await prisma.transaction.deleteMany();

  console.log("Deleting pembayaran...");
  await prisma.pembayaran.deleteMany();

  console.log("Deleting tagihan...");
  await prisma.tagihan.deleteMany();

  console.log("Deleting audit logs...");
  await prisma.auditLog.deleteMany();

  console.log("Deleting prodi pengeluaran...");
  await prisma.prodiPengeluaran.deleteMany();

  console.log("Deleting prodi saldo history...");
  await prisma.prodiSaldoHistory.deleteMany();

  console.log("Deleting prodi saldo...");
  await prisma.prodiSaldo.deleteMany();

  console.log("Deleting topup requests...");
  await prisma.topupRequest.deleteMany();

  // Get non-admin user IDs first to delete their balances
  const nonAdminUsers = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: { id: true },
  });
  const nonAdminIds = nonAdminUsers.map((u) => u.id);

  console.log("Deleting balances for non-admin users...");
  await prisma.balance.deleteMany({
    where: { userId: { in: nonAdminIds } },
  });

  // Delete all users except Admin
  console.log("Deleting non-admin users (operators + mahasiswa)...");
  await prisma.user.deleteMany({
    where: { role: { not: "ADMIN" } },
  });

  console.log("");
  console.log(">> Done! Database cleaned successfully.");
  console.log(">> All Operators and Users deleted.");
  console.log(">> Only Admin account(s) remain.");

  await prisma.$disconnect();
}

resetDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
