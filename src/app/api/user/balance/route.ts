import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/user/balance - Get user balance
export async function GET() {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    let balance = await prisma.balance.findUnique({
      where: { userId: user!.id },
    })

    // Create balance record if not exists
    if (!balance) {
      balance = await prisma.balance.create({
        data: {
          userId: user!.id,
          balance: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: balance.balance,
        updatedAt: balance.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
