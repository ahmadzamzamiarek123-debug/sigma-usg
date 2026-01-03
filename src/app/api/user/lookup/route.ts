import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";

// GET /api/user/lookup?nim=12345678 - Lookup user by NIM
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth("USER");

  if (error) return error;

  try {
    const nim = request.nextUrl.searchParams.get("nim");

    if (!nim || nim.length < 4) {
      return NextResponse.json({
        success: false,
        error: "NIM minimal 4 karakter",
      });
    }

    // Find user by NIM (identifier for USER role)
    const foundUser = await prisma.user.findFirst({
      where: {
        identifier: nim,
        role: "USER",
        isActive: true,
        deletedAt: null,
        // Exclude self
        id: { not: user!.id },
      },
      select: {
        id: true,
        identifier: true,
        name: true,
        prodi: true,
        angkatan: true,
      },
    });

    if (!foundUser) {
      return NextResponse.json({
        success: false,
        error: "NIM tidak ditemukan",
      });
    }

    return NextResponse.json({
      success: true,
      data: foundUser,
    });
  } catch (error) {
    console.error("Error looking up user:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
