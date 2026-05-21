import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

// PATCH /api/admin/users/[id] - Update user (toggle active, change prodi)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user: admin } = await withAuth("ADMIN");

  if (error) return error;

  try {
    const body = await request.json();
    const { action, prodi } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (action === "toggle-active") {
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !targetUser.isActive },
      });

      await createAuditLog(admin!.id, "USER_STATUS_CHANGED", {
        targetUserId: id,
        targetUserName: targetUser.name,
        newStatus: updated.isActive ? "ACTIVE" : "INACTIVE",
      });

      return NextResponse.json({
        success: true,
        message: `User berhasil ${
          updated.isActive ? "diaktifkan" : "dinonaktifkan"
        }`,
        data: { isActive: updated.isActive },
      });
    }

    if (action === "change-prodi" && prodi) {
      const updated = await prisma.user.update({
        where: { id },
        data: { prodi },
      });

      await createAuditLog(admin!.id, "USER_PRODI_CHANGED", {
        targetUserId: id,
        targetUserName: targetUser.name,
        oldProdi: targetUser.prodi,
        newProdi: prodi,
      });

      return NextResponse.json({
        success: true,
        message: "Prodi user berhasil diubah",
        data: { prodi: updated.prodi },
      });
    }

    if (action === "reset-password") {
      const defaultPassword = "password123";
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: true },
      });

      await createAuditLog(admin!.id, "USER_PASSWORD_RESET", {
        targetUserId: id,
        targetUserName: targetUser.name,
      });

      return NextResponse.json({
        success: true,
        message: "Password berhasil direset ke default",
      });
    }

    if (action === "add-balance") {
      const { amount } = body;

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, error: "Jumlah saldo harus lebih dari 0" },
          { status: 400 }
        );
      }

      // Use transaction to prevent race conditions and ensure data consistency
      const { newBalance, amountAdded } = await prisma.$transaction(async (tx) => {
        const existingBalance = await tx.balance.findUnique({
          where: { userId: id },
        });

        const currentBalance = existingBalance?.balance || 0;

        const updated = await tx.balance.upsert({
          where: { userId: id },
          update: { balance: { increment: amount } },
          create: { userId: id, balance: amount },
        });

        await tx.transaction.create({
          data: {
            userId: id,
            type: "TOPUP",
            amount: amount,
            balanceBefore: currentBalance,
            balanceAfter: updated.balance,
            description: `Top-up saldo oleh Admin`,
            createdBy: admin!.id,
          },
        });

        return { newBalance: updated.balance, amountAdded: amount };
      });

      await createAuditLog(admin!.id, "TOPUP_APPROVED", {
        targetUserId: id,
        targetUserName: targetUser.name,
        amount: amountAdded,
        description: "Admin manual add balance",
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan saldo Rp ${amountAdded.toLocaleString(
          "id-ID"
        )}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action tidak valid" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
