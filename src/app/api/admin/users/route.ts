import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/admin/users - Get all users with filters
export async function GET(request: NextRequest) {
  const { error } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const prodi = searchParams.get('prodi')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: {
      role: string
      deletedAt: null
      prodi?: string
      isActive?: boolean
    } = {
      role: 'USER',
      deletedAt: null,
    }

    if (prodi) where.prodi = prodi
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          identifier: true,
          name: true,
          prodi: true,
          angkatan: true,
          isActive: true,
          createdAt: true,
          balance: { select: { balance: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const prodiList = await prisma.user.findMany({
      where: { role: 'USER', deletedAt: null },
      select: { prodi: true },
      distinct: ['prodi'],
    })

    return NextResponse.json({
      success: true,
      data: users,
      total,
      totalPages: Math.ceil(total / limit),
      prodiList: prodiList.map(p => p.prodi).filter(Boolean),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
