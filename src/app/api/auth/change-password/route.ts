import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, pin } = body;

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare update data
    const updateData: {
      passwordHash: string;
      mustChangePassword: boolean;
      pinHash?: string;
    } = {
      passwordHash,
      mustChangePassword: false,
    };

    // Hash PIN if provided (for non-admin)
    if (pin) {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN harus 6 digit angka" },
          { status: 400 }
        );
      }
      updateData.pinHash = await bcrypt.hash(pin, 10);
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
