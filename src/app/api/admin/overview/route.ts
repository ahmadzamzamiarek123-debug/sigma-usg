import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/admin/overview - Get dashboard statistics
export async function GET() {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    // Get counts
    const [
      totalUsers,
      totalOperators,
      pendingTopups,
      totalBalanceResult,
      totalIncomeResult,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'OPERATOR' } }),
      prisma.topupRequest.count({ where: { status: 'PENDING' } }),
      prisma.balance.aggregate({ _sum: { balance: true } }),
      prisma.pembayaran.findMany({
        where: { status: 'SUCCESS' },
        include: { tagihan: { select: { nominal: true } } },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { name: true, role: true },
          },
        },
      }),
    ])

    const totalBalance = totalBalanceResult._sum.balance || 0
    const totalIncome = totalIncomeResult.reduce((sum, p) => sum + p.tagihan.nominal, 0)

    // Recent activity
    const formattedLogs = recentAuditLogs.map((log) => ({
      id: log.id,
      actorName: log.actor.name,
      actorRole: log.actor.role,
      action: log.action,
      detail: log.detail,
      createdAt: log.createdAt,
    }))

    // Get monthly stats
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyStats = await prisma.pembayaran.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startOfMonth },
      },
      include: { tagihan: { select: { nominal: true, jenis: true } } },
    })

    const monthlyIncome = monthlyStats.reduce((sum, p) => sum + p.tagihan.nominal, 0)
    
    const monthlyByJenis = monthlyStats.reduce((acc, p) => {
      const j = p.tagihan.jenis
      if (!acc[j]) acc[j] = 0
      acc[j] += p.tagihan.nominal
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalOperators,
        pendingTopups,
        totalBalance,
        totalIncome,
        monthlyIncome,
        monthlyByJenis: Object.entries(monthlyByJenis).map(([jenis, total]) => ({
          jenis,
          total,
        })),
        recentAuditLogs: formattedLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching overview:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
