import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'

// PATCH /api/tagihan/[id]/deactivate - Toggle tagihan active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const existing = await prisma.tagihan.findUnique({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tagihan tidak ditemukan' },
        { status: 404 }
      )
    }

    const updated = await prisma.tagihan.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    await createAuditLog(user!.id, 'TAGIHAN_STATUS_CHANGED', {
      tagihanId: id,
      tagihanTitle: existing.title,
      newStatus: updated.isActive ? 'ACTIVE' : 'INACTIVE',
    })

    return NextResponse.json({
      success: true,
      message: `Tagihan berhasil ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: { isActive: updated.isActive },
    })
  } catch (error) {
    console.error('Error toggling tagihan status:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
