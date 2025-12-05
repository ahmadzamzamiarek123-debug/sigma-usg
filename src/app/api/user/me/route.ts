import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'

// GET /api/user/me - Get current user info
export async function GET() {
  const { error, user } = await withAuth()
  
  if (error) return error

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        identifier: true,
        name: true,
        role: true,
        prodi: true,
        angkatan: true,
        createdAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
