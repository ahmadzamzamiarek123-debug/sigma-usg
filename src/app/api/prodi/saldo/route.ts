import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/prodi/saldo - Get prodi saldo and stats
export async function GET() {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const userProdi = user!.prodi

    if (!userProdi) {
      return NextResponse.json(
        { success: false, error: 'Prodi tidak ditemukan' },
        { status: 400 }
      )
    }

    // Get or create prodi saldo
    let prodiSaldo = await prisma.prodiSaldo.findUnique({
      where: { prodi: userProdi },
    })

    if (!prodiSaldo) {
      prodiSaldo = await prisma.prodiSaldo.create({
        data: { prodi: userProdi, totalBalance: 0 },
      })
    }

    // Get this month's income (from payments)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const payments = await prisma.pembayaran.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startOfMonth },
        tagihan: { prodiTarget: userProdi },
      },
      include: { tagihan: { select: { nominal: true } } },
    })

    const monthlyIncome = payments.reduce((sum, p) => sum + p.tagihan.nominal, 0)

    // Get this month's expenses
    const expenses = await prisma.prodiPengeluaran.findMany({
      where: {
        prodi: userProdi,
        createdAt: { gte: startOfMonth },
      },
    })

    const monthlyExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Get recent expenses (for display)
    const recentExpenses = await prisma.prodiPengeluaran.findMany({
      where: { prodi: userProdi },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        prodi: userProdi,
        totalBalance: prodiSaldo.totalBalance,
        monthlyIncome,
        monthlyExpense,
        recentExpenses,
      },
    })
  } catch (error) {
    console.error('Error fetching prodi saldo:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
