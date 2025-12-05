import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { createTagihanSchema, paginationSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'

// GET /api/operator/tagihan - Get operator's tagihan
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    })

    const skip = (page - 1) * limit

    // Filter by operator's prodi (admin can see all)
    const prodiFilter = user!.role === 'ADMIN' ? {} : { prodiTarget: user!.prodi }

    const [tagihan, total] = await Promise.all([
      prisma.tagihan.findMany({
        where: prodiFilter,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { name: true },
          },
          _count: {
            select: { pembayaran: true },
          },
        },
      }),
      prisma.tagihan.count({
        where: prodiFilter,
      }),
    ])

    // Get paid count for each tagihan
    const formattedTagihan = await Promise.all(
      tagihan.map(async (t) => {
        const paidCount = await prisma.pembayaran.count({
          where: {
            tagihanId: t.id,
            status: 'SUCCESS',
          },
        })

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          jenis: t.jenis,
          prodiTarget: t.prodiTarget,
          angkatanTarget: t.angkatanTarget,
          nominal: t.nominal,
          deadline: t.deadline,
          isActive: t.isActive,
          createdByName: t.createdBy.name,
          totalPembayaran: t._count.pembayaran,
          paidCount,
          createdAt: t.createdAt,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: formattedTagihan,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching tagihan:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/operator/tagihan - Create new tagihan
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('OPERATOR')
  
  if (error) return error

  try {
    const body = await request.json()
    
    // Validate input
    const validation = createTagihanSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, description, jenis, prodiTarget, angkatanTarget, nominal, deadline } = validation.data

    // Operator can only create tagihan for their prodi
    const targetProdi = user!.role === 'ADMIN' 
      ? prodiTarget 
      : user!.prodi

    const tagihan = await prisma.tagihan.create({
      data: {
        title,
        description,
        jenis,
        prodiTarget: targetProdi,
        angkatanTarget: angkatanTarget || null,
        nominal,
        deadline: new Date(deadline),
        createdByOperatorId: user!.id,
      },
    })

    // Audit log
    await createAuditLog(user!.id, 'TAGIHAN_CREATED', {
      tagihanId: tagihan.id,
      tagihanTitle: title,
      amount: nominal,
    })

    return NextResponse.json({
      success: true,
      message: 'Tagihan berhasil dibuat',
      data: tagihan,
    })
  } catch (error) {
    console.error('Error creating tagihan:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
