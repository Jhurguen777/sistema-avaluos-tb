import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@geopricer.com" },
    update: {},
    create: {
      email: "admin@geopricer.com",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log("✅ Usuario administrador creado:", admin.email)
  console.log("🔑 Contraseña: admin123")
  console.log("📧 Email: admin@geopricer.com")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
