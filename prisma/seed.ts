import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.prodiPengeluaran.deleteMany()
  await prisma.prodiSaldo.deleteMany()
  await prisma.topupRequest.deleteMany()
  await prisma.pembayaran.deleteMany()
  await prisma.tagihan.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.balance.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 12)
  const pinHash = await bcrypt.hash('123456', 12)

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      identifier: 'ADM-00-2401',
      name: 'Administrator Sistem',
      role: 'ADMIN',
      passwordHash,
      isActive: true,
    },
  })
  console.log('✅ Created Admin:', admin.identifier)

  // Create Operators
  const operators = await Promise.all([
    prisma.user.create({
      data: {
        identifier: 'OP-TI-2401',
        name: 'Operator Teknik Informatika',
        role: 'OPERATOR',
        prodi: 'TI',
        passwordHash,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        identifier: 'OP-SI-2401',
        name: 'Operator Sistem Informasi',
        role: 'OPERATOR',
        prodi: 'SI',
        passwordHash,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Created Operators:', operators.length)

  // Create Users (Mahasiswa)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        identifier: '20230001',
        name: 'Ahmad Fauzi',
        role: 'USER',
        prodi: 'TI',
        angkatan: '2023',
        passwordHash,
        pinHash,
        isActive: true,
        balance: { create: { balance: 150000 } },
      },
    }),
    prisma.user.create({
      data: {
        identifier: '20230002',
        name: 'Budi Santoso',
        role: 'USER',
        prodi: 'TI',
        angkatan: '2023',
        passwordHash,
        pinHash,
        isActive: true,
        balance: { create: { balance: 75000 } },
      },
    }),
    prisma.user.create({
      data: {
        identifier: '20230003',
        name: 'Citra Dewi',
        role: 'USER',
        prodi: 'SI',
        angkatan: '2023',
        passwordHash,
        pinHash,
        isActive: true,
        balance: { create: { balance: 200000 } },
      },
    }),
    prisma.user.create({
      data: {
        identifier: '20220001',
        name: 'Deni Kurniawan',
        role: 'USER',
        prodi: 'TI',
        angkatan: '2022',
        passwordHash,
        pinHash,
        isActive: true,
        balance: { create: { balance: 50000 } },
      },
    }),
    prisma.user.create({
      data: {
        identifier: '20220002',
        name: 'Eka Putri',
        role: 'USER',
        prodi: 'SI',
        angkatan: '2022',
        passwordHash,
        pinHash,
        isActive: false, // Inactive user for testing
        balance: { create: { balance: 0 } },
      },
    }),
  ])
  console.log('✅ Created Users:', users.length)

  // Create Prodi Saldo
  await prisma.prodiSaldo.createMany({
    data: [
      { prodi: 'TI', totalBalance: 500000 },
      { prodi: 'SI', totalBalance: 300000 },
    ],
  })
  console.log('✅ Created Prodi Saldo')

  // Create Tagihan
  const tagihan = await Promise.all([
    prisma.tagihan.create({
      data: {
        title: 'Kas Mingguan - Desember 2024',
        description: 'Iuran kas mingguan untuk mahasiswa TI',
        jenis: 'KAS',
        prodiTarget: 'TI',
        nominal: 25000,
        deadline: new Date('2024-12-31'),
        createdByOperatorId: operators[0].id,
        isActive: true,
      },
    }),
    prisma.tagihan.create({
      data: {
        title: 'Seminar Teknologi AI',
        description: 'Kontribusi acara seminar teknologi AI',
        jenis: 'SEMINAR',
        prodiTarget: 'TI',
        nominal: 50000,
        deadline: new Date('2024-12-20'),
        createdByOperatorId: operators[0].id,
        isActive: true,
      },
    }),
    prisma.tagihan.create({
      data: {
        title: 'Kas Bulanan SI',
        description: 'Iuran kas bulanan Sistem Informasi',
        jenis: 'KAS',
        prodiTarget: 'SI',
        nominal: 30000,
        deadline: new Date('2024-12-31'),
        createdByOperatorId: operators[1].id,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Created Tagihan:', tagihan.length)

  // Create some transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: users[0].id,
        type: 'TOPUP',
        amount: 100000,
        balanceBefore: 50000,
        balanceAfter: 150000,
        description: 'Top-up saldo',
        createdBy: admin.id,
      },
      {
        userId: users[0].id,
        type: 'PAYMENT',
        amount: 25000,
        balanceBefore: 150000,
        balanceAfter: 125000,
        description: 'Pembayaran Kas Mingguan',
      },
      {
        userId: users[1].id,
        type: 'TRANSFER_IN',
        amount: 25000,
        balanceBefore: 50000,
        balanceAfter: 75000,
        description: 'Transfer dari Ahmad Fauzi',
        relatedUserId: users[0].id,
      },
    ],
  })
  console.log('✅ Created sample transactions')

  // Create Pengeluaran
  await prisma.prodiPengeluaran.create({
    data: {
      prodi: 'TI',
      amount: 100000,
      description: 'Pembelian alat tulis untuk acara seminar',
      createdById: operators[0].id,
    },
  })
  console.log('✅ Created sample pengeluaran')

  // Update ProdiSaldo after pengeluaran
  await prisma.prodiSaldo.update({
    where: { prodi: 'TI' },
    data: { totalBalance: 400000 },
  })

  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('📝 Test Accounts:')
  console.log('================')
  console.log('Admin:     ADM-00-2401 / password123')
  console.log('Operator:  OP-TI-2401 / password123')
  console.log('Operator:  OP-SI-2401 / password123')
  console.log('User:      20230001 / password123 (PIN: 123456)')
  console.log('User:      20230002 / password123 (PIN: 123456)')
  console.log('User:      20230003 / password123 (PIN: 123456)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
