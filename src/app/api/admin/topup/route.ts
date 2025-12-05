import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { paginationSchema, topupActionSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'

// GET /api/admin/topup - Get all topup requests
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    })
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const whereClause = status ? { status } : {}

    const [requests, total] = await Promise.all([
      prisma.topupRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              identifier: true,
              prodi: true,
            },
          },
          validatedBy: {
            select: { name: true },
          },
        },
      }),
      prisma.topupRequest.count({
        where: whereClause,
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
      userName: r.user.name,
      userIdentifier: r.user.identifier,
      userProdi: r.user.prodi,
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

// POST /api/admin/topup - Process topup request (approve/reject)
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const body = await request.json()
    const { requestId, action, reason } = body

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID diperlukan' },
        { status: 400 }
      )
    }

    // Validate action
    const validation = topupActionSchema.safeParse({ action, reason })
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Get request
    const topupRequest = await prisma.topupRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: { balance: true },
        },
      },
    })

    if (!topupRequest) {
      return NextResponse.json(
        { success: false, error: 'Request tidak ditemukan' },
        { status: 404 }
      )
    }

    if (topupRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Request sudah diproses' },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      // Approve topup
      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.topupRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            validatedAt: new Date(),
            validatedByAdminId: user!.id,
          },
        })

        // Get current balance
        const currentBalance = topupRequest.user.balance?.balance || 0
        const newBalance = currentBalance + topupRequest.amount

        // Update or create balance
        if (topupRequest.user.balance) {
          await tx.balance.update({
            where: { userId: topupRequest.userId },
            data: { balance: newBalance },
          })
        } else {
          await tx.balance.create({
            data: {
              userId: topupRequest.userId,
              balance: newBalance,
            },
          })
        }

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: topupRequest.userId,
            type: 'TOPUP',
            amount: topupRequest.amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: 'Top-up saldo disetujui',
            createdBy: user!.id,
          },
        })
      })

      // Audit log
      await createAuditLog(user!.id, 'TOPUP_APPROVED', {
        targetUserId: topupRequest.userId,
        targetUserName: topupRequest.user.name,
        amount: topupRequest.amount,
      })

      return NextResponse.json({
        success: true,
        message: `Top-up Rp ${topupRequest.amount.toLocaleString('id-ID')} untuk ${topupRequest.user.name} berhasil disetujui`,
      })
    } else {
      // Reject topup
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Alasan penolakan diperlukan' },
          { status: 400 }
        )
      }

      await prisma.topupRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          validatedAt: new Date(),
          validatedByAdminId: user!.id,
        },
      })

      // Audit log
      await createAuditLog(user!.id, 'TOPUP_REJECTED', {
        targetUserId: topupRequest.userId,
        targetUserName: topupRequest.user.name,
        amount: topupRequest.amount,
        description: reason,
      })

      return NextResponse.json({
        success: true,
        message: `Top-up untuk ${topupRequest.user.name} ditolak`,
      })
    }
  } catch (error) {
    console.error('Error processing topup:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
