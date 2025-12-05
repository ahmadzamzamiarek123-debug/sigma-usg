import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/user/finance-summary - Get user finance data for charts
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // 'week', 'month', 'year'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'year') {
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 1)
    } else {
      // Default: last 30 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user!.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const groupedData: Record<string, {
      topup: number
      payment: number
      transfer_out: number
      transfer_in: number
    }> = {}

    transactions.forEach(t => {
      const dateKey = period === 'year' 
        ? `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`
        : t.createdAt.toISOString().split('T')[0]

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          topup: 0,
          payment: 0,
          transfer_out: 0,
          transfer_in: 0,
        }
      }

      switch (t.type) {
        case 'TOPUP':
          groupedData[dateKey].topup += t.amount
          break
        case 'PAYMENT':
          groupedData[dateKey].payment += t.amount
          break
        case 'TRANSFER_OUT':
          groupedData[dateKey].transfer_out += t.amount
          break
        case 'TRANSFER_IN':
          groupedData[dateKey].transfer_in += t.amount
          break
      }
    })

    // Convert to array for chart
    const chartData = Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: formatDateLabel(date, period),
        ...data,
      }))

    // Get totals
    const totals = transactions.reduce(
      (acc, t) => {
        switch (t.type) {
          case 'TOPUP':
            acc.topup += t.amount
            break
          case 'PAYMENT':
            acc.payment += t.amount
            break
          case 'TRANSFER_OUT':
            acc.transfer_out += t.amount
            break
          case 'TRANSFER_IN':
            acc.transfer_in += t.amount
            break
        }
        return acc
      },
      { topup: 0, payment: 0, transfer_out: 0, transfer_in: 0 }
    )

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        totals,
        period,
      },
    })
  } catch (error) {
    console.error('Error fetching finance summary:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

function formatDateLabel(date: string, period: string): string {
  if (period === 'year') {
    const [year, month] = date.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    return `${months[parseInt(month) - 1]} ${year.slice(-2)}`
  }
  
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
