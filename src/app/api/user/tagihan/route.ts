import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/rbac'
import bcrypt from 'bcryptjs'
import { paymentSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'

// GET /api/user/tagihan - Get active tagihan for user
export async function GET() {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const userProdi = user!.prodi
    const userAngkatan = user!.angkatan

    // FIX: Query yang lebih eksplisit untuk menghindari masalah matching
    // Tagihan akan tampil jika:
    // 1. isActive = true DAN deletedAt = null
    // 2. deadline >= now (belum expired)
    // 3. prodiTarget = null (semua prodi) ATAU prodiTarget = user.prodi (case insensitive)
    // 4. angkatanTarget = null (semua angkatan) ATAU angkatanTarget = user.angkatan
    
    const now = new Date()
    
    const tagihan = await prisma.tagihan.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        deadline: { gte: now },
        // Prodi filter: null = semua, atau match dengan user prodi (case insensitive)
        OR: userProdi 
          ? [
              { prodiTarget: null },
              { prodiTarget: userProdi },
              { prodiTarget: userProdi.toUpperCase() },
              { prodiTarget: userProdi.toLowerCase() },
            ]
          : [{ prodiTarget: null }],
      },
      include: {
        createdBy: {
          select: { name: true, prodi: true },
        },
        pembayaran: {
          where: { userId: user!.id },
          select: { status: true, paidAt: true },
        },
      },
      orderBy: { deadline: 'asc' },
    })

    // Filter angkatan di level aplikasi untuk handle null
    const filteredTagihan = tagihan.filter(t => {
      // Jika angkatanTarget null = semua angkatan bisa lihat
      if (!t.angkatanTarget) return true
      // Jika user tidak punya angkatan, hanya lihat tagihan tanpa target angkatan
      if (!userAngkatan) return false
      // Match angkatan
      return t.angkatanTarget === userAngkatan
    })

    const formattedTagihan = filteredTagihan.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      jenis: t.jenis,
      prodiTarget: t.prodiTarget,
      angkatanTarget: t.angkatanTarget,
      nominal: t.nominal,
      deadline: t.deadline.toISOString(), // Ensure ISO format for timezone safety
      createdByName: t.createdBy.name,
      createdByProdi: t.createdBy.prodi,
      isPaid: t.pembayaran.some((p) => p.status === 'SUCCESS'),
      paidAt: t.pembayaran.find((p) => p.status === 'SUCCESS')?.paidAt?.toISOString() || null,
    }))

    return NextResponse.json({
      success: true,
      data: formattedTagihan,
      meta: {
        userProdi,
        userAngkatan,
        total: formattedTagihan.length,
      },
    })
  } catch (error) {
    console.error('Error fetching tagihan:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/user/tagihan - Pay tagihan
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth('USER')
  
  if (error) return error

  try {
    const body = await request.json()
    
    // Validate input
    const validation = paymentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { tagihanId, pin } = validation.data

    // Get user with PIN and balance
    const userData = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { balance: true },
    })

    if (!userData || !userData.pinHash) {
      return NextResponse.json(
        { success: false, error: 'PIN belum diatur' },
        { status: 400 }
      )
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, userData.pinHash)
    if (!isPinValid) {
      return NextResponse.json(
        { success: false, error: 'PIN salah' },
        { status: 401 }
      )
    }

    // Get tagihan
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: tagihanId },
    })

    if (!tagihan) {
      return NextResponse.json(
        { success: false, error: 'Tagihan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!tagihan.isActive || tagihan.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Tagihan sudah tidak aktif' },
        { status: 400 }
      )
    }

    // Check if already paid
    const existingPayment = await prisma.pembayaran.findUnique({
      where: {
        tagihanId_userId: {
          tagihanId,
          userId: user!.id,
        },
      },
    })

    if (existingPayment?.status === 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Tagihan sudah dibayar' },
        { status: 400 }
      )
    }

    // Check balance
    const currentBalance = userData.balance?.balance || 0
    if (currentBalance < tagihan.nominal) {
      return NextResponse.json(
        { success: false, error: 'Saldo tidak mencukupi' },
        { status: 400 }
      )
    }

    // Execute payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newBalance = currentBalance - tagihan.nominal

      // Deduct balance
      await tx.balance.update({
        where: { userId: userData.id },
        data: { balance: newBalance },
      })

      // Create/update pembayaran
      const pembayaran = await tx.pembayaran.upsert({
        where: {
          tagihanId_userId: {
            tagihanId,
            userId: userData.id,
          },
        },
        update: {
          status: 'SUCCESS',
          paidAt: new Date(),
        },
        create: {
          tagihanId,
          userId: userData.id,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: userData.id,
          type: 'PAYMENT',
          amount: tagihan.nominal,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Pembayaran: ${tagihan.title}`,
          createdBy: userData.id,
        },
      })

      // Update prodi saldo (add income)
      if (tagihan.prodiTarget) {
        await tx.prodiSaldo.upsert({
          where: { prodi: tagihan.prodiTarget },
          update: { totalBalance: { increment: tagihan.nominal } },
          create: { prodi: tagihan.prodiTarget, totalBalance: tagihan.nominal },
        })

        // Update or create history record
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        
        await tx.prodiSaldoHistory.upsert({
          where: { prodi_month_year: { prodi: tagihan.prodiTarget, month, year } },
          update: { income: { increment: tagihan.nominal } },
          create: { 
            prodi: tagihan.prodiTarget, 
            month, 
            year, 
            income: tagihan.nominal,
            balance: tagihan.nominal,
          },
        })
      }

      return { pembayaran, transaction, newBalance }
    })

    // Audit log
    await createAuditLog(userData.id, 'PAYMENT_SUCCESS', {
      tagihanId,
      tagihanTitle: tagihan.title,
      amount: tagihan.nominal,
    })

    return NextResponse.json({
      success: true,
      message: `Pembayaran ${tagihan.title} berhasil`,
      data: {
        pembayaranId: result.pembayaran.id,
        transactionId: result.transaction.id,
        newBalance: result.newBalance,
      },
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
