import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";

// GET /api/tagihan/[id]/detail - Get students targeted by this tagihan with payment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user } = await withAuth("OPERATOR");

  if (error) return error;

  try {
    // Get the tagihan
    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
    });

    if (!tagihan) {
      return NextResponse.json(
        { success: false, error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get all users that match the tagihan target (prodi + angkatan)
    const whereClause: Record<string, unknown> = {
      role: "USER",
      isActive: true,
      deletedAt: null,
    };

    if (tagihan.prodiTarget) {
      whereClause.prodi = tagihan.prodiTarget;
    }
    if (tagihan.angkatanTarget) {
      whereClause.angkatan = tagihan.angkatanTarget;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        identifier: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    // Get all successful payments for this tagihan
    const payments = await prisma.pembayaran.findMany({
      where: {
        tagihanId: id,
        status: "SUCCESS",
      },
      select: {
        userId: true,
        createdAt: true,
      },
    });

    const paymentMap = new Map(payments.map((p) => [p.userId, p.createdAt]));

    // Combine data
    const students = users.map((user) => ({
      id: user.id,
      identifier: user.identifier,
      name: user.name,
      hasPaid: paymentMap.has(user.id),
      paidAt: paymentMap.get(user.id)?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tagihan: {
          id: tagihan.id,
          title: tagihan.title,
          nominal: tagihan.nominal,
          deadline: tagihan.deadline,
        },
        students,
        totalStudents: students.length,
        paidCount: students.filter((s) => s.hasPaid).length,
      },
    });
  } catch (error) {
    console.error("Error fetching tagihan detail:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
