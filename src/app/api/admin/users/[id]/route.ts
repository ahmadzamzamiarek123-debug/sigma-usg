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
        data: { passwordHash },
      });

      await createAuditLog(admin!.id, "USER_PASSWORD_RESET", {
        targetUserId: id,
        targetUserName: targetUser.name,
      });

      return NextResponse.json({
        success: true,
        message: "Password berhasil direset ke default (password123)",
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

      // Get or create balance
      const existingBalance = await prisma.balance.findUnique({
        where: { userId: id },
      });

      const currentBalance = existingBalance?.balance || 0;

      if (existingBalance) {
        await prisma.balance.update({
          where: { userId: id },
          data: { balance: { increment: amount } },
        });
      } else {
        await prisma.balance.create({
          data: { userId: id, balance: amount },
        });
      }

      const newBalance = currentBalance + amount;

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: id,
          type: "TOPUP",
          amount: amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Top-up saldo oleh Admin`,
          createdBy: admin!.id,
        },
      });

      await createAuditLog(admin!.id, "TOPUP_APPROVED", {
        targetUserId: id,
        targetUserName: targetUser.name,
        amount: amount,
        description: "Admin manual add balance",
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan saldo Rp ${amount.toLocaleString(
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
