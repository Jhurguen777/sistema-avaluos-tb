/**
 * Script para crear usuario administrador inicial
 * Uso: npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@geopricer.com" }
    })

    if (existingAdmin) {
      console.log("✅ Ya existe un usuario administrador con email admin@geopricer.com")
      return
    }

    // Generar hash del password
    const password = "admin123"
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        id: "admin-user-id-001",
        email: "admin@geopricer.com",
        name: "Administrador del Sistema",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
      }
    })

    console.log("✅ Usuario administrador creado exitosamente")
    console.log("📧 Email:", admin.email)
    console.log("🔑 Password:", password)
    console.log("⚠️  Por favor, cambia el password después del primer login")

  } catch (error) {
    console.error("❌ Error creando administrador:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .then(() => {
    console.log("\n✨ Script finalizado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Script falló:", error)
    process.exit(1)
  })
