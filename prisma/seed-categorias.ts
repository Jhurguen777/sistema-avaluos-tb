import { PrismaClient } from "@prisma/client"
import type { ProductCategoryEnum } from "@prisma/client"

/**
 * Seed: Categorías de producto base del sistema.
 *
 * Crea las categorías con las que trabaja el sistema por ahora.
 * Si en el futuro se necesitan más, basta con agregarlas al arreglo
 * (siempre que el valor exista en el enum ProductCategoryEnum del schema).
 *
 * Uso individual:  npm run db:seed:categorias
 */

declare const require: NodeJS.Require

const categorias: { name: ProductCategoryEnum; description: string }[] = [
  { name: "CASA", description: "Casas y viviendas unifamiliares" },
  { name: "DEPARTAMENTO", description: "Departamentos y apartamentos" },
  { name: "PENTHOUSE", description: "Penthouses y apartamentos de lujo en última planta" },
  { name: "TERRENO", description: "Terrenos y lotes" },
  { name: "LOCAL_COMERCIAL", description: "Locales comerciales y tiendas" },
  { name: "OFICINA", description: "Oficinas y espacios de trabajo" },
  { name: "QUINTA", description: "Quintas y propiedades de esparcimiento" },
  { name: "OTROS", description: "Otras propiedades no clasificadas" },
]

/**
 * Crea las categorías de producto base del sistema (idempotente).
 * @param prisma Cliente Prisma reutilizable.
 */
export async function seedCategorias(prisma: PrismaClient) {
  let creadas = 0
  let omitidas = 0

  for (const cat of categorias) {
    // name no es UNIQUE en el schema, por eso se valida con findFirst
    // para no duplicar categorías si el script se corre varias veces.
    const existe = await prisma.productCategory.findFirst({
      where: { name: cat.name },
    })

    if (existe) {
      omitidas++
      continue
    }

    await prisma.productCategory.create({ data: cat })
    creadas++
  }

  console.log(`✅ Categorías: ${creadas} creadas, ${omitidas} omitidas (ya existían)`)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedCategorias(prisma)
  } catch (e) {
    console.error("❌ Error al sembrar categorías:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
