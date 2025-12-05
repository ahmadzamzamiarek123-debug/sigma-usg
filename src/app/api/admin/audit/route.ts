import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { paginationSchema } from '@/lib/validations'

// GET /api/admin/audit - Get audit logs
export async function GET(request: NextRequest) {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })
    const action = searchParams.get('action')

    const skip = (page - 1) * limit

    const whereClause = action ? { action } : {}

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              name: true,
              role: true,
              identifier: true,
            },
          },
        },
      }),
      prisma.auditLog.count({
        where: whereClause,
      }),
    ])

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      actorName: log.actor.name,
      actorRole: log.actor.role,
      actorIdentifier: log.actor.identifier,
      action: log.action,
      detail: log.detail,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
