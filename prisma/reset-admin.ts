import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const identifier = 'ADM-00-2401'
  const newPassword = 'admin123'
  const passwordHash = await bcrypt.hash(newPassword, 12)

  try {
    const user = await prisma.user.update({
      where: { identifier },
      data: { 
        passwordHash,
        mustChangePassword: false // Agar tidak dipaksa ganti password saat login
      },
    })
    console.log(`✅ Password untuk ${user.identifier} (${user.name}) berhasil diriset menjadi: ${newPassword}`)
  } catch (error) {
    console.error('❌ Gagal meriset password. Pastikan identifier ADM-00-2401 ada di database.')
    console.error(error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
