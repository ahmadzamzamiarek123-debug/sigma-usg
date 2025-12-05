import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { paginationSchema } from '@/lib/validations'

// GET /api/user/transactions - Get transaction history
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    })

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          relatedUser: {
            select: { name: true, identifier: true },
          },
        },
      }),
      prisma.transaction.count({
        where: { userId: user!.id },
      }),
    ])

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      description: t.description,
      relatedUserName: t.relatedUser?.name || null,
      relatedUserIdentifier: t.relatedUser?.identifier || null,
      createdAt: t.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
