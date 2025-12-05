import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { topupRequestSchema, paginationSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'

// GET /api/user/topup - Get user's topup request history
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

    const [requests, total] = await Promise.all([
      prisma.topupRequest.findMany({
        where: { userId: user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          validatedBy: {
            select: { name: true },
          },
        },
      }),
      prisma.topupRequest.count({
        where: { userId: user!.id },
      }),
    ])

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      evidenceUrl: r.evidenceUrl,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      validatedAt: r.validatedAt,
      validatedByName: r.validatedBy?.name || null,
    }))

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching topup requests:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/user/topup - Create new topup request
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const body = await request.json()
    
    // Validate input
    const validation = topupRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount } = validation.data

    // Check for pending requests
    const pendingRequest = await prisma.topupRequest.findFirst({
      where: {
        userId: user!.id,
        status: 'PENDING',
      },
    })

    if (pendingRequest) {
      return NextResponse.json(
        { success: false, error: 'Masih ada request top-up yang pending' },
        { status: 400 }
      )
    }

    // Create request
    const topupRequest = await prisma.topupRequest.create({
      data: {
        userId: user!.id,
        amount,
        status: 'PENDING',
      },
    })

    // Audit log
    await createAuditLog(user!.id, 'TOPUP_REQUESTED', {
      amount,
    })

    return NextResponse.json({
      success: true,
      message: `Request top-up Rp ${amount.toLocaleString('id-ID')} berhasil dibuat`,
      data: topupRequest,
    })
  } catch (error) {
    console.error('Error creating topup request:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
