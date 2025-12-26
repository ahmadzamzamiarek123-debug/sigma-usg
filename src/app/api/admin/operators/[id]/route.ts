import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

// DELETE /api/admin/operators/[id] - Delete operator (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await withAuth("ADMIN");

  if (error) return error;

  try {
    const { id } = await params;

    // Find operator
    const operator = await prisma.user.findUnique({
      where: { id, role: "OPERATOR" },
    });

    if (!operator) {
      return NextResponse.json(
        { success: false, error: "Operator tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete operator
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    await createAuditLog(user!.id, "OPERATOR_DELETED", {
      targetUserId: operator.id,
      targetUserName: operator.name,
      targetUserIdentifier: operator.identifier,
    });

    return NextResponse.json({
      success: true,
      message: "Operator berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting operator:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/operators/[id] - Reset password or toggle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await withAuth("ADMIN");

  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Find operator
    const operator = await prisma.user.findUnique({
      where: { id, role: "OPERATOR" },
    });

    if (!operator) {
      return NextResponse.json(
        { success: false, error: "Operator tidak ditemukan" },
        { status: 404 }
      );
    }

    if (action === "reset-password") {
      // Reset password to default
      const defaultPassword = "password123";
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      // Audit log
      await createAuditLog(user!.id, "USER_PASSWORD_RESET", {
        targetUserId: operator.id,
        targetUserName: operator.name,
        targetUserIdentifier: operator.identifier,
        role: "OPERATOR",
      });

      return NextResponse.json({
        success: true,
        message: "Password operator berhasil direset ke: password123",
      });
    }

    if (action === "toggle-active") {
      const newStatus = !operator.isActive;

      await prisma.user.update({
        where: { id },
        data: { isActive: newStatus },
      });

      // Audit log
      await createAuditLog(user!.id, "OPERATOR_STATUS_CHANGED", {
        targetUserId: operator.id,
        targetUserName: operator.name,
        targetUserIdentifier: operator.identifier,
        newStatus: newStatus ? "active" : "inactive",
      });

      return NextResponse.json({
        success: true,
        message: `Operator berhasil ${
          newStatus ? "diaktifkan" : "dinonaktifkan"
        }`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action tidak valid" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating operator:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
