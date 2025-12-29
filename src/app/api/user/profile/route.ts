import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { updateProfileSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

// PUT /api/user/profile - Update user profile (password/PIN)
export async function PUT(request: NextRequest) {
  const { error, user } = await withAuth();

  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, currentPin, newPin } =
      validation.data;

    // Get user from database to check mustChangePassword flag
    const dbUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        passwordHash: true,
        pinHash: true,
        mustChangePassword: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: {
      passwordHash?: string;
      pinHash?: string;
      mustChangePassword?: boolean;
    } = {};

    // Handle password change
    if (newPassword) {
      // If user must change password (first-time setup), no need for current password
      if (!dbUser.mustChangePassword) {
        // Normal password change - require current password
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: "Password saat ini harus diisi" },
            { status: 400 }
          );
        }

        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          dbUser.passwordHash
        );
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, error: "Password saat ini salah" },
            { status: 401 }
          );
        }
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);

      // Clear mustChangePassword flag when password is changed
      if (dbUser.mustChangePassword) {
        updateData.mustChangePassword = false;
      }
    }

    // Handle PIN change
    if (newPin) {
      // If user doesn't have PIN yet (first-time setup), no need for current PIN
      if (dbUser.pinHash) {
        // Normal PIN change - require current PIN
        if (!currentPin) {
          return NextResponse.json(
            { success: false, error: "PIN saat ini harus diisi" },
            { status: 400 }
          );
        }

        const isPinValid = await bcrypt.compare(currentPin, dbUser.pinHash);
        if (!isPinValid) {
          return NextResponse.json(
            { success: false, error: "PIN saat ini salah" },
            { status: 401 }
          );
        }
      }

      updateData.pinHash = await bcrypt.hash(newPin, 10);
    }

    // If no changes, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada perubahan yang dilakukan" },
        { status: 400 }
      );
    }

    // Update user
    await prisma.user.update({
      where: { id: user!.id },
      data: updateData,
    });

    // Audit log
    if (updateData.passwordHash) {
      await createAuditLog(user!.id, "PASSWORD_CHANGED", {});
    }

    return NextResponse.json({
      success: true,
      message: updateData.passwordHash
        ? updateData.pinHash
          ? "Password dan PIN berhasil diubah"
          : "Password berhasil diubah"
        : "PIN berhasil diubah",
      mustChangePassword:
        updateData.mustChangePassword === false ? false : undefined,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
