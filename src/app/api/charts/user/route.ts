import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/charts/user - Get chart data for user dashboard
export async function GET() {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const userProdi = user!.prodi

    // Get monthly transaction data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await prisma.transaction.findMany({
      where: {
        user: { prodi: userProdi },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
    })

    // Process monthly data
    const monthlyData: Record<string, { pemasukan: number; pengeluaran: number; transfer: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      monthlyData[key] = { pemasukan: 0, pengeluaran: 0, transfer: 0 }
    }

    transactions.forEach(t => {
      const date = new Date(t.createdAt)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      if (monthlyData[key]) {
        if (t.type === 'TOPUP' || t.type === 'TRANSFER_IN') {
          monthlyData[key].pemasukan += t.amount
        } else if (t.type === 'PAYMENT' || t.type === 'TRANSFER_OUT') {
          monthlyData[key].pengeluaran += t.amount
        }
        if (t.type === 'TRANSFER_IN' || t.type === 'TRANSFER_OUT') {
          monthlyData[key].transfer += 1
        }
      }
    })

    // Get prodi total saldo
    const prodiBalances = await prisma.balance.findMany({
      where: { user: { prodi: userProdi } },
      select: { balance: true },
    })
    const totalProdiSaldo = prodiBalances.reduce((sum, b) => sum + b.balance, 0)

    // Convert to chart format
    const chartData = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      Pemasukan: data.pemasukan,
      Pengeluaran: data.pengeluaran,
      Transfer: data.transfer,
    }))

    return NextResponse.json({
      success: true,
      data: {
        monthlyData: chartData,
        totalProdiSaldo,
        prodi: userProdi,
      },
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
