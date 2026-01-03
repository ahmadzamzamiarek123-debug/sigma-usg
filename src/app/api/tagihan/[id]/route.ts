import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";

// GET /api/tagihan/[id] - Get tagihan detail with payment list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user } = await withAuth("OPERATOR");

  if (error) return error;

  try {
    const tagihan = await prisma.tagihan.findUnique({
      where: { id, deletedAt: null },
      include: {
        pembayaran: {
          where: { status: "SUCCESS" },
          include: {
            user: {
              select: { id: true, name: true, identifier: true, prodi: true },
            },
          },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!tagihan) {
      return NextResponse.json(
        { success: false, error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tagihan });
  } catch (error) {
    console.error("Error fetching tagihan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT /api/tagihan/[id] - Edit tagihan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user } = await withAuth("OPERATOR");

  if (error) return error;

  try {
    const body = await request.json();
    const { title, description, nominal, deadline, angkatanTarget } = body;

    const existing = await prisma.tagihan.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.tagihan.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description ?? existing.description,
        nominal: nominal ? Number(nominal) : existing.nominal,
        deadline: deadline ? new Date(deadline) : existing.deadline,
        angkatanTarget: angkatanTarget ?? existing.angkatanTarget,
      },
    });

    await createAuditLog(user!.id, "TAGIHAN_UPDATED", {
      tagihanId: id,
      tagihanTitle: updated.title,
      changes: { title, nominal, deadline },
    });

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil diupdate",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating tagihan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE /api/tagihan/[id] - HARD DELETE tagihan (permanent)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user } = await withAuth("OPERATOR");

  if (error) return error;

  try {
    const existing = await prisma.tagihan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    // First delete related pembayaran records
    await prisma.pembayaran.deleteMany({
      where: { tagihanId: id },
    });

    // Then hard delete the tagihan
    await prisma.tagihan.delete({
      where: { id },
    });

    await createAuditLog(user!.id, "TAGIHAN_DELETED", {
      tagihanId: id,
      tagihanTitle: existing.title,
      deleteType: "HARD_DELETE",
    });

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil dihapus permanen",
    });
  } catch (error) {
    console.error("Error deleting tagihan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
