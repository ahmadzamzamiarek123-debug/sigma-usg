import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { dateRangeSchema } from '@/lib/validations'

// GET /api/operator/laporan - Get income report
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const { startDate, endDate } = dateRangeSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })
    const jenis = searchParams.get('jenis')
    const prodi = searchParams.get('prodi')

    // Build date filter
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Build where clause
    const prodiFilter = user!.role === 'ADMIN' 
      ? (prodi ? { prodiTarget: prodi } : {})
      : { prodiTarget: user!.prodi }

    const whereClause = {
      status: 'SUCCESS',
      paidAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      tagihan: {
        ...prodiFilter,
        ...(jenis ? { jenis } : {}),
      },
    }

    // Get successful payments
    const payments = await prisma.pembayaran.findMany({
      where: whereClause,
      include: {
        tagihan: {
          select: {
            jenis: true,
            nominal: true,
            prodiTarget: true,
            title: true,
          },
        },
        user: {
          select: { name: true, identifier: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    // Calculate totals
    const totalIncome = payments.reduce((sum, p) => sum + p.tagihan.nominal, 0)
    
    // Group by jenis
    const byJenis = payments.reduce((acc, p) => {
      const j = p.tagihan.jenis
      if (!acc[j]) acc[j] = { count: 0, total: 0 }
      acc[j].count++
      acc[j].total += p.tagihan.nominal
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    // Group by prodi (for admin)
    const byProdi = payments.reduce((acc, p) => {
      const prod = p.tagihan.prodiTarget || 'Semua Prodi'
      if (!acc[prod]) acc[prod] = { count: 0, total: 0 }
      acc[prod].count++
      acc[prod].total += p.tagihan.nominal
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    const report = {
      totalIncome,
      totalTransactions: payments.length,
      byJenis: Object.entries(byJenis).map(([jenis, data]) => ({
        jenis,
        ...data,
      })),
      byProdi: user!.role === 'ADMIN'
        ? Object.entries(byProdi).map(([prodi, data]) => ({
            prodi,
            ...data,
          }))
        : undefined,
      recentPayments: payments.slice(0, 20).map((p) => ({
        id: p.id,
        tagihanTitle: p.tagihan.title,
        jenis: p.tagihan.jenis,
        nominal: p.tagihan.nominal,
        userName: p.user.name,
        userIdentifier: p.user.identifier,
        paidAt: p.paidAt,
      })),
    }

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
