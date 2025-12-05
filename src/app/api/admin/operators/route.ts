import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import { createOperatorSchema } from '@/lib/validations'
import { generateOperatorCode } from '@/lib/utils'
import { createAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'

// GET /api/admin/operators - Get all operators
export async function GET() {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR', deletedAt: null },
      select: {
        id: true,
        identifier: true,
        name: true,
        prodi: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: operators,
    })
  } catch (error) {
    console.error('Error fetching operators:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/admin/operators - Create new operator
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const body = await request.json()
    
    // Validate input
    const validation = createOperatorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, prodi, password } = validation.data

    // Generate operator code
    const identifier = generateOperatorCode(prodi)

    // Check if identifier already exists
    const existing = await prisma.user.findUnique({
      where: { identifier },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Kode operator sudah ada, coba lagi' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create operator
    const operator = await prisma.user.create({
      data: {
        identifier,
        name,
        role: 'OPERATOR',
        prodi,
        passwordHash,
      },
    })

    // Audit log
    await createAuditLog(user!.id, 'OPERATOR_CREATED', {
      targetUserId: operator.id,
      targetUserIdentifier: identifier,
      prodi,
    })

    return NextResponse.json({
      success: true,
      message: 'Operator berhasil dibuat',
      data: {
        id: operator.id,
        identifier: operator.identifier,
        name: operator.name,
        prodi: operator.prodi,
      },
    })
  } catch (error) {
    console.error('Error creating operator:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
