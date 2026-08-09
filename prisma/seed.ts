import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

/**
 * Seed: Usuario administrador inicial.
 *
 * Crea (o confirma) el usuario ADMIN usando las variables de entorno
 * ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME. Es idempotente (upsert).
 *
 * Uso individual:  npx prisma db seed  (o integrado en seed-all.ts)
 *
 * @param prisma Cliente Prisma reutilizable.
 */
export async function seedAdmin(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL ?? "admin@geopricer.com"
  const password = process.env.ADMIN_PASSWORD ?? "admin123"
  const name = process.env.ADMIN_NAME ?? "Administrador"

  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Usuario administrador: ${admin.email}`)
}

declare const require: NodeJS.Require

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedAdmin(prisma)
  } catch (e) {
    console.error("❌ Error al sembrar admin:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
