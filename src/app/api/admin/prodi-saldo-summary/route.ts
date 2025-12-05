import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/admin/prodi-saldo-summary - Get prodi saldo data for admin charts
export async function GET() {
  const { error } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    // Get current saldo per prodi
    const prodiSaldos = await prisma.prodiSaldo.findMany({
      orderBy: { prodi: 'asc' },
    })

    // Get users grouped by prodi with their balances (fallback if prodiSaldo empty)
    const usersByProdi = await prisma.user.groupBy({
      by: ['prodi'],
      where: { 
        role: 'USER', 
        isActive: true, 
        deletedAt: null,
        prodi: { not: null },
      },
      _count: { id: true },
    })

    // Get balance per prodi from user balances
    const balancesByProdi: Record<string, number> = {}
    for (const group of usersByProdi) {
      if (group.prodi) {
        const balances = await prisma.balance.aggregate({
          where: { user: { prodi: group.prodi, role: 'USER' } },
          _sum: { balance: true },
        })
        balancesByProdi[group.prodi] = balances._sum.balance || 0
      }
    }

    // Format saldo data for bar chart
    const saldoData = prodiSaldos.length > 0
      ? prodiSaldos.map(s => ({
          prodi: s.prodi,
          balance: s.totalBalance,
        }))
      : Object.entries(balancesByProdi).map(([prodi, balance]) => ({
          prodi,
          balance,
        }))

    // Get historical data from ProdiSaldoHistory
    const currentYear = new Date().getFullYear()
    const historyRecords = await prisma.prodiSaldoHistory.findMany({
      where: { year: currentYear },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    // Format history data for line chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const prodiList = [...new Set(historyRecords.map(h => h.prodi))]
    
    const historyByMonth: Record<number, Record<string, number>> = {}
    historyRecords.forEach(h => {
      if (!historyByMonth[h.month]) {
        historyByMonth[h.month] = {}
      }
      historyByMonth[h.month][h.prodi] = h.balance
    })

    const historyData = Object.entries(historyByMonth)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([month, data]) => ({
        month: months[parseInt(month) - 1],
        ...data,
      }))

    // Get summary stats
    const totalSystemBalance = await prisma.balance.aggregate({
      _sum: { balance: true },
    })

    const activeUsers = await prisma.user.count({
      where: { role: 'USER', isActive: true, deletedAt: null },
    })

    const activeOperators = await prisma.user.count({
      where: { role: 'OPERATOR', isActive: true, deletedAt: null },
    })

    return NextResponse.json({
      success: true,
      data: {
        saldoData,
        historyData,
        prodiList,
        summary: {
          totalSystemBalance: totalSystemBalance._sum.balance || 0,
          activeUsers,
          activeOperators,
          totalProdi: saldoData.length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching prodi saldo summary:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
