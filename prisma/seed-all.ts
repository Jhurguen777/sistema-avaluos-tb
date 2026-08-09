import { PrismaClient } from "@prisma/client"
import { seedAdmin } from "./seed"
import { seedCategorias } from "./seed-categorias"
import { seedConfiguracion } from "./seed-config"

/**
 * Seed MAESTRO del sistema GeoPricer Avalúos.
 *
 * Ejecuta todos los seeders en orden, compartiendo una sola instancia
 * de PrismaClient. Todos son idempotentes, por lo que es seguro
 * re-ejecutarlo sin duplicar datos.
 *
 * Orden:
 *   1. Usuario administrador        (users)
 *   2. Categorías de producto       (product_categories)
 *   3. Configuración de avalúos     (valores_reposicion + parametros_avaluo)
 *
 * Uso:  npx prisma db seed
 */
async function main() {
  const prisma = new PrismaClient()
  try {
    console.log("=== Seed maestro del sistema ===\n")

    await seedAdmin(prisma)
    await seedCategorias(prisma)
    await seedConfiguracion(prisma)

    console.log("\n✅ Seed maestro completado.")
  } catch (e) {
    console.error("❌ Error en seed maestro:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
