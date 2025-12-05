import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'

// PATCH /api/admin/operators/[id]/toggle-active - Toggle operator active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, user: admin } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    // Get operator
    const operator = await prisma.user.findUnique({
      where: { id, role: 'OPERATOR', deletedAt: null },
    })

    if (!operator) {
      return NextResponse.json(
        { success: false, error: 'Operator tidak ditemukan' },
        { status: 404 }
      )
    }

    // Toggle status
    const newStatus = !operator.isActive
    await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
    })

    // Create audit log
    await createAuditLog(admin!.id, 'OPERATOR_STATUS_CHANGED', {
      operatorId: id,
      operatorName: operator.name,
      operatorProdi: operator.prodi,
      previousStatus: operator.isActive ? 'ACTIVE' : 'INACTIVE',
      newStatus: newStatus ? 'ACTIVE' : 'INACTIVE',
    })

    return NextResponse.json({
      success: true,
      message: `Operator ${operator.name} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: { isActive: newStatus },
    })
  } catch (error) {
    console.error('Error toggling operator status:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
