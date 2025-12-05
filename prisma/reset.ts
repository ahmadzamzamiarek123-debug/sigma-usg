import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log(">> Resetting database (soft reset)...");

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

  // Hapus semua user KECUALI Admin
  console.log("Deleting non-admin users...");
  await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" }
    },
  });

  console.log(">> Done! Database cleaned successfully.");
  console.log(">> Admin users are preserved.");
  
  await prisma.$disconnect();
}

resetDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
