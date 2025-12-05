import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import bcrypt from 'bcryptjs'
import { createAuditLog } from '@/lib/audit'

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

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  const { error, user: admin } = await withAuth('ADMIN')
  
  if (error) return error

  try {
    const body = await request.json()
    const { identifier, name, prodi, angkatan, password } = body

    // Validate required fields
    if (!identifier || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Identifier, nama, dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Check if NIM is valid (8 digits)
    if (!/^\d{8}$/.test(identifier)) {
      return NextResponse.json(
        { success: false, error: 'NIM harus 8 digit angka' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { identifier },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'NIM sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const hashedPin = await bcrypt.hash('123456', 10) // Default PIN

    // Create user with balance
    const newUser = await prisma.user.create({
      data: {
        identifier,
        name,
        prodi: prodi?.toUpperCase() || null,
        angkatan: angkatan || null,
        passwordHash: hashedPassword,
        pinHash: hashedPin,
        role: 'USER',
        balance: {
          create: { balance: 0 },
        },
      },
      select: {
        id: true,
        identifier: true,
        name: true,
        prodi: true,
        angkatan: true,
      },
    })

    // Audit log
    await createAuditLog(admin!.id, 'USER_STATUS_CHANGED', {
      targetUserId: newUser.id,
      targetUserName: newUser.name,
      description: `Created new user: ${newUser.identifier}`,
    })

    return NextResponse.json({
      success: true,
      message: `User ${newUser.name} berhasil dibuat`,
      data: newUser,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

