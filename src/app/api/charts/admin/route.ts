import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/charts/admin - Get chart data for admin dashboard
export async function GET() {
  const { error } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get all transactions for monthly data
    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      include: { user: { select: { prodi: true } } },
    })

    // Process monthly system-wide data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const monthlyData: Record<string, { pemasukan: number; pengeluaran: number }> = {}
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      monthlyData[key] = { pemasukan: 0, pengeluaran: 0 }
    }

    transactions.forEach(t => {
      const date = new Date(t.createdAt)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      if (monthlyData[key]) {
        if (t.type === 'TOPUP') {
          monthlyData[key].pemasukan += t.amount
        } else if (t.type === 'PAYMENT') {
          monthlyData[key].pengeluaran += t.amount
        }
      }
    })

    // Get saldo per prodi
    const users = await prisma.user.findMany({
      where: { role: 'USER', isActive: true, deletedAt: null },
      include: { balance: true },
    })

    const prodiSaldo: Record<string, number> = {}
    users.forEach(u => {
      if (u.prodi && u.balance) {
        prodiSaldo[u.prodi] = (prodiSaldo[u.prodi] || 0) + u.balance.balance
      }
    })

    const prodiSaldoChart = Object.entries(prodiSaldo).map(([name, value]) => ({
      name,
      value,
    }))

    // Get user stats
    const activeUsers = await prisma.user.count({
      where: { role: 'USER', isActive: true, deletedAt: null },
    })
    const inactiveUsers = await prisma.user.count({
      where: { role: 'USER', isActive: false },
    })

    // Get operator stats per prodi
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR', deletedAt: null },
      select: { prodi: true, isActive: true },
    })

    const operatorPerProdi: Record<string, number> = {}
    operators.forEach(o => {
      if (o.prodi && o.isActive) {
        operatorPerProdi[o.prodi] = (operatorPerProdi[o.prodi] || 0) + 1
      }
    })

    const operatorChart = Object.entries(operatorPerProdi).map(([name, value]) => ({
      name,
      value,
    }))

    // Total system saldo
    const allBalances = await prisma.balance.aggregate({
      _sum: { balance: true },
    })

    // Convert monthly data to chart format
    const chartData = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      Pemasukan: data.pemasukan,
      Pengeluaran: data.pengeluaran,
    }))

    return NextResponse.json({
      success: true,
      data: {
        monthlyData: chartData,
        prodiSaldo: prodiSaldoChart,
        userStats: {
          active: activeUsers,
          inactive: inactiveUsers,
        },
        operatorPerProdi: operatorChart,
        totalSystemSaldo: allBalances._sum.balance || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching admin chart data:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
