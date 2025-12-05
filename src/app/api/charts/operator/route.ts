import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/charts/operator - Get chart data for operator dashboard
export async function GET() {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const operatorProdi = user!.prodi

    // Get monthly payment data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const payments = await prisma.pembayaran.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: sixMonthsAgo },
        tagihan: {
          prodiTarget: operatorProdi,
        },
      },
      include: {
        tagihan: { select: { jenis: true, nominal: true } },
      },
    })

    // Process data by type
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const monthlyData: Record<string, { KAS: number; ACARA: number; SEMINAR: number; OTHER: number }> = {}
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      monthlyData[key] = { KAS: 0, ACARA: 0, SEMINAR: 0, OTHER: 0 }
    }

    payments.forEach(p => {
      if (p.paidAt) {
        const date = new Date(p.paidAt)
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`
        if (monthlyData[key]) {
          const jenis = p.tagihan.jenis as keyof typeof monthlyData[string]
          monthlyData[key][jenis] += p.tagihan.nominal
        }
      }
    })

    // Get tagihan status counts
    const tagihan = await prisma.tagihan.findMany({
      where: {
        prodiTarget: operatorProdi,
        deletedAt: null,
      },
      include: {
        pembayaran: { where: { status: 'SUCCESS' } },
      },
    })

    let totalPaid = 0
    let totalUnpaid = 0

    tagihan.forEach(t => {
      totalPaid += t.pembayaran.length
      // Estimate unpaid (based on prodi user count)
    })

    // Get prodi pengeluaran
    const prodiSaldo = await prisma.prodiSaldo.findUnique({
      where: { prodi: operatorProdi || '' },
    })

    // Convert to chart format
    const chartData = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      Kas: data.KAS,
      Acara: data.ACARA,
      Seminar: data.SEMINAR,
    }))

    // Jenis breakdown
    const jenisBreakdown = payments.reduce((acc: Record<string, number>, p) => {
      const jenis = p.tagihan.jenis
      acc[jenis] = (acc[jenis] || 0) + p.tagihan.nominal
      return acc
    }, {})

    const jenisChartData = Object.entries(jenisBreakdown).map(([name, value]) => ({
      name,
      value,
    }))

    return NextResponse.json({
      success: true,
      data: {
        monthlyData: chartData,
        jenisBreakdown: jenisChartData,
        totalPaid,
        totalTagihan: tagihan.length,
        prodiSaldo: prodiSaldo?.totalBalance || 0,
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
