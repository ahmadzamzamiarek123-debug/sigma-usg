import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'

// GET /api/prodi/pengeluaran - Get pengeluaran list
export async function GET() {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const operatorProdi = user!.prodi

    const pengeluaran = await prisma.prodiPengeluaran.findMany({
      where: { prodi: operatorProdi || '' },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    const prodiSaldo = await prisma.prodiSaldo.findUnique({
      where: { prodi: operatorProdi || '' },
    })

    return NextResponse.json({
      success: true,
      data: {
        pengeluaran,
        currentBalance: prodiSaldo?.totalBalance || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching pengeluaran:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/prodi/pengeluaran - Create new pengeluaran
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const body = await request.json()
    const { amount, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah harus lebih dari 0' },
        { status: 400 }
      )
    }

    if (!description || description.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Deskripsi wajib diisi (min. 3 karakter)' },
        { status: 400 }
      )
    }

    const operatorProdi = user!.prodi

    if (!operatorProdi) {
      return NextResponse.json(
        { success: false, error: 'Prodi tidak ditemukan' },
        { status: 400 }
      )
    }

    // Get or create prodi saldo
    let prodiSaldo = await prisma.prodiSaldo.findUnique({
      where: { prodi: operatorProdi },
    })

    if (!prodiSaldo) {
      prodiSaldo = await prisma.prodiSaldo.create({
        data: { prodi: operatorProdi, totalBalance: 0 },
      })
    }

    if (prodiSaldo.totalBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Saldo prodi tidak mencukupi' },
        { status: 400 }
      )
    }

    // Create pengeluaran and update saldo in transaction
    const result = await prisma.$transaction(async (tx) => {
      const pengeluaran = await tx.prodiPengeluaran.create({
        data: {
          prodi: operatorProdi,
          amount: Number(amount),
          description: description.trim(),
          createdById: user!.id,
        },
      })

      const updatedSaldo = await tx.prodiSaldo.update({
        where: { prodi: operatorProdi },
        data: { totalBalance: { decrement: Number(amount) } },
      })

      return { pengeluaran, newBalance: updatedSaldo.totalBalance }
    })

    await createAuditLog(user!.id, 'PENGELUARAN_CREATED', {
      prodi: operatorProdi,
      amount,
      description,
      newBalance: result.newBalance,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil dicatat',
      data: result,
    })
  } catch (error) {
    console.error('Error creating pengeluaran:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
